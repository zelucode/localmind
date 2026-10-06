import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/files', () => ({
  copyText: vi.fn(),
  downloadTextFile: vi.fn(),
}));

import { copyText, downloadTextFile } from '../lib/files';
import { ExportMarkdownModal } from './ExportMarkdownModal';
import { ToolBookmark } from '../types';

const copy = vi.mocked(copyText);
const download = vi.mocked(downloadTextFile);

const bm = (over: Partial<ToolBookmark> = {}): ToolBookmark => ({
  id: 'a',
  title: 'Alpha [beta]',
  url: 'https://alpha.example.com/a_(b)',
  description: 'Line one\nline two | pipe',
  category: 'developer',
  isAi: false,
  freeTierBadge: 'Free Web Tool',
  tags: ['x'],
  createdAt: '2026-01-01',
  ...over,
});

function setup(bookmarks = [bm()]) {
  render(<ExportMarkdownModal isOpen onClose={() => {}} bookmarks={bookmarks} activeCategoryName="Developer" />);
}

const preview = () => document.querySelector('.whitespace-pre-wrap.select-all')!.textContent!;

beforeEach(() => vi.clearAllMocks());

describe('ExportMarkdownModal', () => {
  it('does not claim every tool is free or needs no account, and has no placeholder links', () => {
    setup();
    expect(preview()).not.toMatch(/no account required|100% free|fcksignups/i);
    expect(preview()).not.toContain('https://github.com)');
    expect(preview()).toContain('Scope: Developer');
  });

  it('keeps table rows on one line and escapes brackets, pipes and parentheses', () => {
    setup();
    const row = preview().split('\n').find((l) => l.startsWith('| **'))!;
    expect(row).toContain('**Alpha \\[beta\\]**');
    expect(row).toContain('Line one line two \\| pipe');
    expect(row).toContain('(https://alpha.example.com/a_(b%29)');
  });

  it('list format keeps descriptions on one line', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /list/i }));
    expect(preview()).toContain('- **Description**: Line one line two | pipe');
  });

  it('downloads a LocalMind-named .md file', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /download \.md/i }));
    expect(download).toHaveBeenCalledWith(expect.stringMatching(/^localmind_tools_table_\d{4}-\d{2}-\d{2}\.md$/), expect.any(String), 'text/markdown');
  });

  it('reports whether the copy worked', async () => {
    copy.mockResolvedValueOnce(false);
    setup();
    await userEvent.click(screen.getByRole('button', { name: /copy markdown/i }));
    expect(await screen.findByText(/copy failed/i)).toBeInTheDocument();
    expect(screen.queryByText(/copied markdown/i)).not.toBeInTheDocument();
  });
});
