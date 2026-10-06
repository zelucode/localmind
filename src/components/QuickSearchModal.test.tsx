import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));
vi.mock('../lib/files', () => ({ copyText: vi.fn(), downloadTextFile: vi.fn() }));

import { openExternal } from '../lib/tauri';
import { copyText } from '../lib/files';
import { QuickSearchModal } from './QuickSearchModal';
import { AITool } from '../types';

const perplexity = { id: 'p', name: 'Perplexity AI', url: 'https://www.perplexity.ai', quickSearchUrlTemplate: 'https://www.perplexity.ai/search?q={query}' } as AITool;
const aiStudio = { id: 'g', name: 'Google AI Studio', url: 'https://aistudio.google.com', quickSearchUrlTemplate: 'https://aistudio.google.com/prompts/new_chat' } as AITool;

function setup(tool: AITool) {
  const onClose = vi.fn();
  render(<QuickSearchModal tool={tool} onClose={onClose} />);
  return { onClose };
}

const type = (text: string) => userEvent.type(document.getElementById('input-quick-search-query')!, text);
const launch = () => userEvent.click(document.getElementById('btn-launch-search')!);

beforeEach(() => vi.clearAllMocks());

describe('QuickSearchModal', () => {
  it('opens the tool with the prompt in the link and closes', async () => {
    const { onClose } = setup(perplexity);
    await type('hello world');
    await launch();
    expect(openExternal).toHaveBeenCalledWith('https://www.perplexity.ai/search?q=hello%20world');
    expect(onClose).toHaveBeenCalled();
  });

  it('opens the plain tool page when no prompt was typed', async () => {
    const { onClose } = setup(perplexity);
    await launch();
    expect(openExternal).toHaveBeenCalledWith('https://www.perplexity.ai');
    expect(onClose).toHaveBeenCalled();
  });

  it('submits with Enter', async () => {
    setup(perplexity);
    await type('hi{Enter}');
    expect(openExternal).toHaveBeenCalledWith('https://www.perplexity.ai/search?q=hi');
  });

  it('tells the user up front when a tool cannot take a prompt from a link', () => {
    setup(aiStudio);
    expect(screen.getByText(/cannot take a prompt from a link: Launch copies it/i)).toBeInTheDocument();
  });

  it('copies the prompt, opens the tool and says what to do, instead of silently losing the prompt', async () => {
    vi.mocked(copyText).mockResolvedValueOnce(true);
    const { onClose } = setup(aiStudio);
    await type('write a haiku');
    await launch();
    expect(copyText).toHaveBeenCalledWith('write a haiku');
    expect(openExternal).toHaveBeenCalledWith('https://aistudio.google.com');
    expect(await screen.findByRole('status')).toHaveTextContent(/copied to your clipboard.*paste it into Google AI Studio/i);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('says so when the copy failed', async () => {
    vi.mocked(copyText).mockResolvedValueOnce(false);
    setup(aiStudio);
    await type('x');
    await launch();
    expect(await screen.findByRole('status')).toHaveTextContent(/copying failed/i);
  });
});
