import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));

import { openExternal } from '../lib/tauri';
import { Omnibar } from './Omnibar';

const open = vi.mocked(openExternal);
beforeEach(() => {
  open.mockReset();
});

const box = () => screen.getByPlaceholderText(/Type any search query/);

describe('Omnibar', () => {
  it('opens Perplexity with the typed prompt, encoded', async () => {
    render(<Omnibar />);
    await userEvent.type(box(), '  rust & tauri? ');
    await userEvent.click(screen.getByRole('button', { name: /Perplexity Search/ }));
    expect(open).toHaveBeenCalledWith('https://www.perplexity.ai/search?q=rust%20%26%20tauri%3F');
  });

  it('opens ChatGPT with the typed prompt', async () => {
    render(<Omnibar />);
    await userEvent.type(box(), 'hello world');
    await userEvent.click(screen.getByRole('button', { name: /ChatGPT/ }));
    expect(open).toHaveBeenCalledWith('https://chatgpt.com/?q=hello%20world');
  });

  it('opens the plain site when nothing (or only spaces) was typed', async () => {
    render(<Omnibar />);
    await userEvent.click(screen.getByRole('button', { name: /Perplexity Search/ }));
    await userEvent.type(box(), '   ');
    await userEvent.click(screen.getByRole('button', { name: /ChatGPT/ }));
    expect(open).toHaveBeenNthCalledWith(1, 'https://www.perplexity.ai');
    expect(open).toHaveBeenNthCalledWith(2, 'https://chatgpt.com');
  });

  it('Enter searches on Perplexity', async () => {
    render(<Omnibar />);
    await userEvent.type(box(), 'free gpu{Enter}');
    expect(open).toHaveBeenCalledWith('https://www.perplexity.ai/search?q=free%20gpu');
  });

  it('a sample search fills the box and opens Perplexity', async () => {
    render(<Omnibar />);
    await userEvent.click(screen.getByRole('button', { name: 'Open source LLM benchmarks' }));
    expect(box()).toHaveValue('Open source LLM benchmarks');
    expect(open).toHaveBeenCalledWith('https://www.perplexity.ai/search?q=Open%20source%20LLM%20benchmarks');
  });

  it('hides the Advisor button unless an Advisor handler is given, and passes the prompt to it', async () => {
    const { unmount } = render(<Omnibar />);
    expect(document.getElementById('btn-omnibar-advisor')).not.toBeInTheDocument();
    unmount();
    const onOpenAdvisor = vi.fn();
    render(<Omnibar onOpenAdvisor={onOpenAdvisor} />);
    await userEvent.type(box(), 'which tool');
    await userEvent.click(document.getElementById('btn-omnibar-advisor')!);
    expect(onOpenAdvisor).toHaveBeenCalledWith('which tool');
  });

  it('calls the Config and Rate-Limit shortcuts', async () => {
    const onConfig = vi.fn();
    const onLimits = vi.fn();
    render(<Omnibar onOpenConfigExporter={onConfig} onOpenRateLimitMatrix={onLimits} />);
    await userEvent.click(screen.getByRole('button', { name: /Config/ }));
    await userEvent.click(screen.getByRole('button', { name: /Rate|Limit/ }));
    expect(onConfig).toHaveBeenCalledTimes(1);
    expect(onLimits).toHaveBeenCalledTimes(1);
  });
});
