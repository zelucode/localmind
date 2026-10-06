import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/files', () => ({ copyText: vi.fn(), downloadTextFile: vi.fn() }));

import { copyText } from '../lib/files';
import { ToolCard } from './ToolCard';
import { INITIAL_AI_TOOLS } from '../data/defaultTools';
import { AITool } from '../types';

const custom: AITool = { ...INITIAL_AI_TOOLS[0], id: 'custom_1', name: 'My Custom Tool', isCustom: true, isFavorite: false };

function setup(tool: AITool = custom) {
  const props = { tool, onToggleFavorite: vi.fn(), onDeleteCustom: vi.fn() };
  render(<ToolCard {...props} />);
  return props;
}

beforeEach(() => vi.clearAllMocks());

describe('ToolCard', () => {
  it('deletes a custom tool only after a second click', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Delete My Custom Tool' }));
    expect(props.onDeleteCustom).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete My Custom Tool' }));
    expect(props.onDeleteCustom).toHaveBeenCalledWith('custom_1');
  });

  it('offers no delete for built-in tools', () => {
    setup({ ...custom, isCustom: false });
    expect(screen.queryByRole('button', { name: /^Delete / })).not.toBeInTheDocument();
  });

  it('only says the link was copied when it was', async () => {
    vi.mocked(copyText).mockResolvedValueOnce(true);
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Copy website link' }));
    expect(copyText).toHaveBeenCalledWith(custom.url);
    expect(await screen.findByRole('button', { name: 'Copy website link' })).toHaveAttribute('title', 'Link copied');
  });

  it('reports a failed copy', async () => {
    vi.mocked(copyText).mockResolvedValueOnce(false);
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Copy website link' }));
    expect(await screen.findByTitle('Copy failed')).toBeInTheDocument();
  });
});
