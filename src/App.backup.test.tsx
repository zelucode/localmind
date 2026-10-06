import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const enc = (v: string) => 'enc:v1:' + btoa(v);
const dec = (t: string) => atob(t.slice('enc:v1:'.length));

vi.mock('./lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/backend')>()),
  probePorts: vi.fn().mockResolvedValue([]),
  verifyApiKey: vi.fn(),
  encryptSecrets: async (values: string[]) => values.map(enc),
  decryptSecrets: async (tokens: string[]) => tokens.map((t) => ({ value: dec(t), error: null })),
  // Reversible stand-ins for the Rust Argon2 + AES-GCM commands: the passphrase must match to open the text.
  encryptBackup: async (text: string, passphrase: string) =>
    JSON.stringify({ format: 'localmind-encrypted-backup', blob: btoa(unescape(encodeURIComponent(`${passphrase}\n${text}`))) }),
  decryptBackup: async (file: string, passphrase: string) => {
    const [pass, ...rest] = decodeURIComponent(escape(atob(JSON.parse(file).blob))).split('\n');
    if (pass !== passphrase) throw new Error('Wrong passphrase, or the file has been changed.');
    return rest.join('\n');
  },
}));

const download = vi.fn();
vi.mock('./lib/files', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/files')>()),
  downloadTextFile: (...args: unknown[]) => download(...args),
}));

import App from './App';

const KEYS = 'ai_nexus_api_keys_v1';
const BOOKMARKS = 'ai_nexus_bookmarks_v3';
const nav = (label: string) => within(document.getElementById('app-left-sidebar')!).getByRole('button', { name: label });

const storedKey = {
  id: 'k1',
  provider: 'gemini',
  providerName: 'Google Gemini',
  key: 'AIzaMYSECRET',
  label: 'Dev',
  createdAt: '2026-01-01',
  freeTierNotes: '',
  getKeyUrl: '',
};

beforeEach(() => {
  localStorage.clear();
  download.mockClear();
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  localStorage.setItem('ai_nexus_show_loading_v1', 'false');
  localStorage.setItem('ai_nexus_show_startup_v1', 'false');
  localStorage.setItem(KEYS, JSON.stringify([{ ...storedKey, key: '', blob: enc('AIzaMYSECRET') }]));
  return () => {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  };
});

async function openDataTab() {
  await userEvent.click(nav('Settings'));
  await userEvent.click(await screen.findByRole('button', { name: /data|backup/i }));
}

describe('backup and restore in the app', () => {
  it('exports without API keys by default, and with them only when asked', async () => {
    render(<App />);
    await openDataTab();
    await userEvent.click(screen.getByRole('button', { name: /download backup json/i }));
    const [name, text, mime] = download.mock.calls[0];
    expect(name).toMatch(/^localmind-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(mime).toBe('application/json');
    expect(text).not.toContain('AIzaMYSECRET');
    expect(JSON.parse(text).bookmarks.length).toBeGreaterThan(100);

    // Including keys switches passphrase protection on; switching it off again exports them as plain text.
    await userEvent.click(screen.getByRole('checkbox', { name: /include my api keys/i }));
    expect(screen.getByRole('checkbox', { name: /protect the file with a passphrase/i })).toBeChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: /protect the file with a passphrase/i }));
    await userEvent.click(screen.getByRole('button', { name: /download backup json/i }));
    expect(download.mock.calls[1][1]).toContain('AIzaMYSECRET');
  });

  it('exports a passphrase-protected backup that does not show the keys, and restores it with the passphrase', async () => {
    render(<App />);
    await openDataTab();
    await userEvent.click(screen.getByRole('checkbox', { name: /include my api keys/i }));
    await userEvent.type(screen.getByLabelText('Backup passphrase'), 'correct horse battery');
    await userEvent.type(screen.getByLabelText('Confirm passphrase'), 'correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: /download protected backup/i }));

    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    const [name, text] = download.mock.calls[0];
    expect(name).toMatch(/^localmind-backup-\d{4}-\d{2}-\d{2}-encrypted\.json$/);
    expect(text).not.toContain('AIzaMYSECRET');
    expect(await screen.findByRole('status')).toHaveTextContent(/cannot be recovered/i);

    // Restore it: the app asks for the passphrase first, and a wrong one restores nothing.
    localStorage.removeItem(KEYS);
    await userEvent.upload(screen.getByLabelText('Backup file'), new File([text], name, { type: 'application/json' }));
    expect(await screen.findByText(/is protected with a passphrase/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restore and replace/i })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Passphrase for this backup'), 'wrong one');
    await userEvent.click(screen.getByRole('button', { name: 'Open backup' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/wrong passphrase/i);
    expect(localStorage.getItem(KEYS)).toBeNull();

    await userEvent.clear(screen.getByLabelText('Passphrase for this backup'));
    await userEvent.type(screen.getByLabelText('Passphrase for this backup'), 'correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: 'Open backup' }));
    await userEvent.click(await screen.findByRole('button', { name: /restore and replace/i }));
    await waitFor(() => expect(localStorage.getItem(KEYS)).toContain('enc:v1:'));
    expect(JSON.parse(localStorage.getItem(KEYS)!)).toHaveLength(1);
  });

  it('restores only the sections in the file: bookmarks change, saved keys are kept', async () => {
    render(<App />);
    await openDataTab();
    const backup = JSON.stringify({ version: 2, bookmarks: [{ id: 'only', title: 'Only One', url: 'https://only.example.com' }] });
    await userEvent.upload(screen.getByLabelText('Backup file'), new File([backup], 'b.json', { type: 'application/json' }));
    await userEvent.click(await screen.findByRole('button', { name: /restore and replace/i }));

    await waitFor(() => expect(JSON.parse(localStorage.getItem(BOOKMARKS)!)).toHaveLength(1));
    expect(JSON.parse(localStorage.getItem(BOOKMARKS)!)[0]).toMatchObject({ id: 'only', title: 'Only One' });
    expect(localStorage.getItem(KEYS)).toContain('enc:v1:');
    expect(JSON.parse(localStorage.getItem(KEYS)!)).toHaveLength(1);
  });

  it('a file without anything to restore changes nothing', async () => {
    render(<App />);
    await openDataTab();
    const before = localStorage.getItem(BOOKMARKS);
    await userEvent.upload(screen.getByLabelText('Backup file'), new File(['{"x":1}'], 'b.json', { type: 'application/json' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nothing LocalMind can restore/i);
    expect(localStorage.getItem(BOOKMARKS)).toBe(before);
  });

  it('restoring keys re-encrypts them before they reach storage', async () => {
    render(<App />);
    await openDataTab();
    const backup = JSON.stringify({ version: 2, keys: [{ ...storedKey, id: 'k2', key: 'AIzaRESTOREDKEY' }] });
    await userEvent.upload(screen.getByLabelText('Backup file'), new File([backup], 'b.json', { type: 'application/json' }));
    await userEvent.click(await screen.findByRole('button', { name: /restore and replace/i }));

    await waitFor(() => expect(localStorage.getItem(KEYS)).toContain(enc('AIzaRESTOREDKEY')));
    expect(localStorage.getItem(KEYS)).not.toContain('"key":"AIzaRESTOREDKEY"');
  });

  it('factory reset deletes saved keys only after confirmation', async () => {
    render(<App />);
    await openDataTab();
    await userEvent.click(screen.getByRole('button', { name: /^reset tools, keys & themes$/i }));
    expect(localStorage.getItem(KEYS)).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /yes, delete and reset/i }));
    await waitFor(() => expect(localStorage.getItem(KEYS)).toBeNull());
  });
});
