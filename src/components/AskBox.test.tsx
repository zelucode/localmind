import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AITool } from '../types';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));
vi.mock('../lib/files', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/files')>()),
  copyText: vi.fn(async () => true),
}));

import { openExternal } from '../lib/tauri';
import { copyText } from '../lib/files';
import { AskBox } from './AskBox';
import { ASK_ENGINE_STORAGE_KEY } from '../lib/askEngines';

const open = vi.mocked(openExternal);
const copy = vi.mocked(copyText);

const make = (id: string, name: string, extra: Partial<AITool> = {}) =>
  ({ id, name, category: 'web-llm', url: `https://${id}.example.com`, ...extra }) as AITool;

const tools = [
  make('chatgpt', 'ChatGPT', { quickSearchUrlTemplate: 'https://chatgpt.example.com/?q={query}' }),
  make('perplexity', 'Perplexity AI', { quickSearchUrlTemplate: 'https://perplexity.example.com/search?q={query}' }),
  make('studio', 'AI Studio'),
  make('cursor', 'Cursor', { category: 'coding-agent' }),
];

beforeEach(() => {
  open.mockReset();
  copy.mockClear();
  localStorage.clear();
});

const box = () => screen.getByPlaceholderText(/Type any question/);
const engineSelect = () => screen.getByLabelText('Engine') as HTMLSelectElement;
const ask = () => userEvent.click(screen.getByRole('button', { name: 'Ask' }));

describe('AskBox', () => {
  it('lists only web chatbots from the catalog and defaults to Perplexity on first run', () => {
    render(<AskBox tools={tools} />);
    expect(engineSelect().value).toBe('perplexity');
    expect([...engineSelect().options].map((o) => o.text)).toEqual(['ChatGPT', 'Perplexity AI', 'AI Studio']);
  });

  it('sends the encoded prompt to the default engine only', async () => {
    render(<AskBox tools={tools} />);
    await userEvent.type(box(), '  rust & tauri? ');
    await ask();
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('https://perplexity.example.com/search?q=rust%20%26%20tauri%3F');
  });

  it('Enter sends to the default engine', async () => {
    render(<AskBox tools={tools} />);
    await userEvent.type(box(), 'free gpu{Enter}');
    expect(open).toHaveBeenCalledWith('https://perplexity.example.com/search?q=free%20gpu');
  });

  it('opens the plain site when nothing was typed', async () => {
    render(<AskBox tools={tools} />);
    await ask();
    expect(open).toHaveBeenCalledWith('https://perplexity.example.com');
    expect(copy).not.toHaveBeenCalled();
  });

  it('changing the engine sends there and is remembered', async () => {
    const { unmount } = render(<AskBox tools={tools} />);
    await userEvent.selectOptions(engineSelect(), 'chatgpt');
    expect(localStorage.getItem(ASK_ENGINE_STORAGE_KEY)).toBe('chatgpt');
    await userEvent.type(box(), 'hi');
    await ask();
    expect(open).toHaveBeenCalledWith('https://chatgpt.example.com/?q=hi');
    unmount();

    render(<AskBox tools={tools} />);
    expect(engineSelect().value).toBe('chatgpt');
  });

  it('copies the prompt and says so when the engine has no prompt link', async () => {
    render(<AskBox tools={tools} />);
    await userEvent.selectOptions(engineSelect(), 'studio');
    await userEvent.type(box(), 'my prompt');
    expect(screen.getByText(/cannot take a prompt from a link: it is copied/)).toBeInTheDocument();
    await ask();
    expect(copy).toHaveBeenCalledWith('my prompt');
    expect(open).toHaveBeenCalledWith('https://studio.example.com');
    expect(screen.getByRole('status')).toHaveTextContent(/copied to your clipboard: paste it into AI Studio/);
  });

  it('says the prompt is prefilled when the engine takes it from the link', async () => {
    render(<AskBox tools={tools} />);
    expect(screen.getByText('Opens Perplexity AI')).toBeInTheDocument();
    await userEvent.type(box(), 'x');
    expect(screen.getByText('Prompt is prefilled in Perplexity AI')).toBeInTheDocument();
  });

  it('example chips only fill the box; they do not send', async () => {
    render(<AskBox tools={tools} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open source LLM benchmarks' }));
    expect(box()).toHaveValue('Open source LLM benchmarks');
    expect(open).not.toHaveBeenCalled();
  });

  it('shows no IDE Configs / Limits buttons any more', () => {
    render(<AskBox tools={tools} />);
    expect(screen.queryByRole('button', { name: /IDE Configs|Limits/ })).not.toBeInTheDocument();
  });

  it('hides the Advisor button unless a handler is given, and passes the prompt to it', async () => {
    const { unmount } = render(<AskBox tools={tools} />);
    expect(document.getElementById('btn-omnibar-advisor')).not.toBeInTheDocument();
    unmount();
    const onOpenAdvisor = vi.fn();
    render(<AskBox tools={tools} onOpenAdvisor={onOpenAdvisor} />);
    await userEvent.type(box(), 'which tool');
    await userEvent.click(document.getElementById('btn-omnibar-advisor')!);
    expect(onOpenAdvisor).toHaveBeenCalledWith('which tool');
  });

  it('shows a plain message when the catalog has no web AI tools', () => {
    render(<AskBox tools={[tools[3]]} />);
    expect(screen.getByText(/No web AI tools in the catalog/)).toBeInTheDocument();
  });
});

describe('AskBox ask several', () => {
  const toggle = () => userEvent.click(screen.getByRole('switch', { name: /Ask several/ }));
  const chip = (name: string) => screen.getByRole('button', { name: new RegExp(name) });

  it('is off by default: no chips, and the engine picker is shown', () => {
    render(<AskBox tools={tools} />);
    expect(screen.getByRole('switch', { name: /Ask several/ })).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByRole('group', { name: 'Pick the AIs to ask' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Engine')).toBeInTheDocument();
  });

  it('sends to every ticked engine, and the button says how many', async () => {
    render(<AskBox tools={tools} />);
    await toggle();
    expect(screen.getByRole('button', { name: 'Pick AIs' })).toBeDisabled();
    await userEvent.click(chip('ChatGPT'));
    await userEvent.click(chip('Perplexity AI'));
    await userEvent.type(box(), 'hello');
    await userEvent.click(screen.getByRole('button', { name: 'Ask 2 AIs' }));
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenCalledWith('https://chatgpt.example.com/?q=hello');
    expect(open).toHaveBeenCalledWith('https://perplexity.example.com/search?q=hello');
    expect(copy).not.toHaveBeenCalled();
  });

  it('copies the prompt once and names the engines to paste into', async () => {
    render(<AskBox tools={tools} />);
    await toggle();
    await userEvent.click(chip('ChatGPT'));
    await userEvent.click(chip('AI Studio'));
    await userEvent.type(box(), 'my prompt');
    expect(screen.getByText(/1 prefilled, 1 need a paste \(AI Studio\)/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ask 2 AIs' }));
    expect(copy).toHaveBeenCalledTimes(1);
    expect(copy).toHaveBeenCalledWith('my prompt');
    expect(open).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('status')).toHaveTextContent(/paste it \(Ctrl\+V\) into AI Studio/);
  });

  it('remembers the picked set across renders and caps it at 5', async () => {
    const many = Array.from({ length: 6 }, (_, i) => make(`e${i}`, `Engine${i}`));
    const { unmount } = render(<AskBox tools={many} />);
    await toggle();
    for (let i = 0; i < 5; i++) await userEvent.click(chip(`Engine${i}`));
    expect(chip('Engine5')).toBeDisabled();
    unmount();

    render(<AskBox tools={many} />);
    await toggle();
    expect(chip('Engine0')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Engine5')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Ask 5 AIs' })).toBeEnabled();
  });
});
