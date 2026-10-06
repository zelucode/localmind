import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Every copy button must say "copied" only when the clipboard accepted the text.
vi.mock('../lib/files', () => ({ copyText: vi.fn(), downloadTextFile: vi.fn() }));
vi.mock('../lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/backend')>()),
  probePorts: vi.fn().mockResolvedValue([]),
  verifyApiKey: vi.fn(),
}));

import { copyText } from '../lib/files';
import { ApiKeyVaultModal } from './ApiKeyVaultModal';
import { BookmarksPage } from './BookmarksPage';
import { OmniRouteWidget } from './OmniRouteWidget';
import { StoredApiKey, ToolBookmark } from '../types';

const copy = vi.mocked(copyText);

beforeEach(() => vi.clearAllMocks());

const key: StoredApiKey = {
  id: 'k1',
  provider: 'groq',
  providerName: 'Groq Cloud',
  key: 'gsk_abcdefghijklmnop',
  label: 'My Groq',
  createdAt: '2026-01-01',
  freeTierNotes: '',
  getKeyUrl: '',
  lastTestedStatus: 'unknown',
};

const bookmark: ToolBookmark = {
  id: 'b1',
  title: 'Alpha',
  url: 'https://alpha.example.com',
  description: 'A tool',
  category: 'developer',
  isAi: false,
  freeTierBadge: 'Free',
  tags: [],
  createdAt: '2026-01-01',
};

describe('Key Vault: copy key', () => {
  const setup = () =>
    render(<ApiKeyVaultModal inline isOpen onClose={() => {}} keys={[key]} onAddKey={vi.fn()} onDeleteKey={vi.fn()} onKeyTested={vi.fn()} />);

  it('copies the real key and shows a check only on success', async () => {
    copy.mockResolvedValueOnce(true);
    setup();
    const button = screen.getByRole('button', { name: 'Copy Key' });
    await userEvent.click(button);
    expect(copy).toHaveBeenCalledWith('gsk_abcdefghijklmnop');
    await waitFor(() => expect(button.innerHTML).toContain('emerald'));
  });

  it('shows a failure instead of a check when the clipboard refuses', async () => {
    copy.mockResolvedValueOnce(false);
    setup();
    const button = screen.getByRole('button', { name: 'Copy Key' });
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('title', 'Copy failed'));
    expect(button.innerHTML).not.toContain('emerald');
  });
});

describe('Bookmarks: copy URL', () => {
  const setup = () =>
    render(
      <BookmarksPage
        bookmarks={[bookmark]}
        onAddBookmark={vi.fn()}
        onUpdateBookmark={vi.fn()}
        onDeleteBookmark={vi.fn()}
        onToggleFavorite={vi.fn()}
        onRecordClick={vi.fn()}
        onResetToDefaults={vi.fn()}
        onImportBookmarks={vi.fn()}
        onOpenAddModal={vi.fn()}
        onEditBookmark={vi.fn()}
        onOpenExportImportModal={vi.fn()}
      />,
    );

  it('copies the link and shows success', async () => {
    copy.mockResolvedValueOnce(true);
    setup();
    const button = screen.getByRole('button', { name: 'Copy URL for Alpha' });
    await userEvent.click(button);
    expect(copy).toHaveBeenCalledWith('https://alpha.example.com');
    await waitFor(() => expect(button.innerHTML).toContain('emerald'));
  });

  it('shows a failure when the copy failed', async () => {
    copy.mockResolvedValueOnce(false);
    setup();
    const button = screen.getByRole('button', { name: 'Copy URL for Alpha' });
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('title', 'Copy failed'));
  });
});

describe('Runtimes: copy start command', () => {
  it('copies the command, and shows a failure icon when it did not work', async () => {
    copy.mockResolvedValueOnce(false);
    render(<OmniRouteWidget />);
    const buttons = await screen.findAllByTitle('Copy start command');
    await userEvent.click(buttons[0]);
    expect(copy).toHaveBeenCalledOnce();
    expect(copy.mock.calls[0][0]).toEqual(expect.any(String));
    await waitFor(() => expect(buttons[0].innerHTML).toContain('rose'));
    expect(buttons[0].innerHTML).not.toContain('emerald');
  });
});
