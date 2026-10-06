import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/files', () => ({
  copyText: vi.fn(),
  downloadTextFile: vi.fn(),
}));

import { copyText, downloadTextFile } from '../lib/files';
import { ExportImportBookmarksModal } from './ExportImportBookmarksModal';
import { ToolBookmark } from '../types';

const copy = vi.mocked(copyText);
const download = vi.mocked(downloadTextFile);

const bm = (over: Partial<ToolBookmark> = {}): ToolBookmark => ({
  id: 'a',
  title: 'Alpha',
  url: 'https://alpha.example.com',
  description: 'The alpha tool',
  category: 'developer',
  isAi: false,
  freeTierBadge: 'Free Web Tool',
  tags: [],
  createdAt: '2026-01-01',
  ...over,
});

const existing = [bm(), bm({ id: 'b', title: 'Beta', url: 'https://beta.example.com', isFavorite: true })];

function setup(over: Partial<React.ComponentProps<typeof ExportImportBookmarksModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    bookmarks: existing,
    onImportBookmarks: vi.fn(() => ({ bookmarks: existing, added: 1, updated: 0, skipped: 1 })),
    onResetToDefaults: vi.fn(),
    ...over,
  };
  render(<ExportImportBookmarksModal {...props} />);
  return props;
}

const openImport = () => userEvent.click(document.getElementById('tab-import-bookmarks')!);
const paste = (text: string) => {
  fireEvent.change(screen.getByPlaceholderText(/paste a json backup/i), { target: { value: text } });
};

const JSON_IMPORT = JSON.stringify([
  { title: 'Alpha again', url: 'https://alpha.example.com/' },
  { title: 'Gamma', url: 'https://gamma.example.com' },
  { title: 'Evil', url: 'javascript:alert(1)' },
]);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('export tab', () => {
  it('shows a preview of the chosen format and its size', async () => {
    setup();
    expect(screen.getByText(/"app": "LocalMind"/)).toBeInTheDocument();
    await userEvent.click(document.getElementById('export-format-csv')!);
    expect(screen.getByText(/"Title","URL","Category"/)).toBeInTheDocument();
  });

  it('exports only favorites when asked', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /favorites only \(1\)/i }));
    expect(screen.getByText(/1 items/)).toBeInTheDocument();
  });

  it('downloads under a LocalMind file name, with a BOM only for CSV', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /download file/i }));
    expect(download).toHaveBeenLastCalledWith(expect.stringMatching(/^localmind_bookmarks_all_\d{4}-\d{2}-\d{2}\.json$/), expect.any(String), 'application/json', false);
    await userEvent.click(document.getElementById('export-format-csv')!);
    await userEvent.click(screen.getByRole('button', { name: /download file/i }));
    expect(download).toHaveBeenLastCalledWith(expect.stringMatching(/\.csv$/), expect.any(String), 'text/csv', true);
  });

  it('says Copied only when the copy worked', async () => {
    copy.mockResolvedValueOnce(true);
    setup();
    await userEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));
    expect(await screen.findByText(/copied to clipboard!/i)).toBeInTheDocument();
  });

  it('reports a failed copy', async () => {
    copy.mockResolvedValueOnce(false);
    setup();
    await userEvent.click(screen.getByRole('button', { name: /copy to clipboard/i }));
    expect(await screen.findByText(/copy failed/i)).toBeInTheDocument();
    expect(screen.queryByText(/copied to clipboard!/i)).not.toBeInTheDocument();
  });
});

describe('import tab', () => {
  it('does not promise drag and drop it does not have', async () => {
    setup();
    await openImport();
    expect(screen.queryByText(/drop file/i)).not.toBeInTheDocument();
    expect(screen.getByText(/click to choose a file/i)).toBeInTheDocument();
  });

  it('previews new versus existing links and the entries it left out', async () => {
    setup();
    await openImport();
    paste(JSON_IMPORT);
    expect(screen.getByText(/found 2 bookmarks \(json format\)/i)).toBeInTheDocument();
    expect(screen.getByText(/1 new • 1 already in your list • 1 left out/i)).toBeInTheDocument();
  });

  it('shows the real JSON error instead of a generic one', async () => {
    setup();
    await openImport();
    paste('{"bookmarks": [');
    expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
    expect(document.getElementById('btn-confirm-import')).toBeDisabled();
  });

  it('imports with the chosen mode and reports what really happened', async () => {
    const props = setup();
    await openImport();
    paste(JSON_IMPORT);
    await userEvent.click(screen.getByRole('button', { name: /import 2 bookmarks/i }));
    expect(props.onImportBookmarks).toHaveBeenCalledWith(
      [expect.objectContaining({ title: 'Alpha again' }), expect.objectContaining({ title: 'Gamma' })],
      'merge',
      'json',
    );
    expect(screen.getByText('Imported: 1 added, 1 skipped.')).toBeInTheDocument();
  });

  it('reads a CSV file chosen through the file picker', async () => {
    setup();
    await openImport();
    const file = new File(['Title,URL\nNew,https://new.example.com\n'], 'tools.csv', { type: 'text/csv' });
    await userEvent.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
    expect(await screen.findByText(/found 1 bookmarks \(csv format\)/i)).toBeInTheDocument();
  });

  it('refuses to replace everything without a second, explicit confirmation', async () => {
    const props = setup();
    await openImport();
    paste(JSON_IMPORT);
    await userEvent.click(screen.getByText('Replace All'));
    await userEvent.click(screen.getByRole('button', { name: /import 2 bookmarks/i }));
    expect(props.onImportBookmarks).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/deletes all 2 current bookmarks/i);

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(props.onImportBookmarks).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /import 2 bookmarks/i }));
    await userEvent.click(screen.getByRole('button', { name: /yes, replace everything/i }));
    expect(props.onImportBookmarks).toHaveBeenCalledWith(expect.any(Array), 'replace', 'json');
  });

  it('asks before resetting to the defaults, and cancel keeps the list', async () => {
    const props = setup();
    await openImport();
    await userEvent.click(screen.getByRole('button', { name: /reset to \d+ defaults/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/custom bookmarks and favorites will be lost/i);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(props.onResetToDefaults).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /reset to \d+ defaults/i }));
    await userEvent.click(screen.getByRole('button', { name: /yes, reset to defaults/i }));
    expect(props.onResetToDefaults).toHaveBeenCalledOnce();
    expect(props.onClose).toHaveBeenCalled();
  });
});
