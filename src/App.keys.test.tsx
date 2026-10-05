import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Fake Rust crypto: reversible so a "reload" can decrypt, and clearly not plaintext.
const enc = (v: string) => 'enc:v1:' + btoa(v);
const dec = (t: string) => atob(t.slice('enc:v1:'.length));
const encryptSecrets = vi.fn(async (values: string[]) => values.map(enc));
const decryptSecrets = vi.fn(async (tokens: string[]) =>
  tokens.map((t) => (t.includes('orphan') ? { value: null, error: 'wrong key' } : { value: dec(t), error: null }))
);

vi.mock('./lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/backend')>()),
  probePorts: vi.fn().mockResolvedValue([]),
  verifyApiKey: vi.fn(),
  encryptSecrets: (v: string[]) => encryptSecrets(v),
  decryptSecrets: (t: string[]) => decryptSecrets(t),
}));

import App from './App';

const STORAGE = 'ai_nexus_api_keys_v1';
const nav = (label: string) => within(document.getElementById('app-left-sidebar')!).getByRole('button', { name: label });

beforeEach(() => {
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  localStorage.setItem('ai_nexus_show_loading_v1', 'false');
  localStorage.setItem('ai_nexus_show_startup_v1', 'false');
  encryptSecrets.mockClear();
  decryptSecrets.mockClear();
  return () => {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  };
});

const storedKey = (over: Record<string, unknown> = {}) => ({
  id: 'k1',
  provider: 'gemini',
  providerName: 'Google Gemini',
  key: 'AIzaSECRET',
  label: 'Dev',
  createdAt: '2026-01-01',
  freeTierNotes: '',
  getKeyUrl: '',
  ...over,
});

async function addKey(secret: string) {
  await userEvent.click(nav('Key Vault'));
  await userEvent.type(screen.getByPlaceholderText('Paste your API key here...'), secret);
  await userEvent.click(screen.getByRole('button', { name: /Save/i }));
}

describe('encrypted key storage in the app', () => {
  it('stores a new key only in encrypted form', async () => {
    render(<App />);
    await addKey('AIzaSyBrandNewSecret123');

    await waitFor(() => expect(localStorage.getItem(STORAGE)).toContain('enc:v1:'));
    expect(localStorage.getItem(STORAGE)).not.toContain('AIzaSyBrandNewSecret123');
  });

  it('migrates legacy plaintext keys to encrypted storage on startup', async () => {
    localStorage.setItem(STORAGE, JSON.stringify([storedKey()]));
    render(<App />);

    await waitFor(() => expect(localStorage.getItem(STORAGE)).toContain('enc:v1:'));
    expect(localStorage.getItem(STORAGE)).not.toContain('AIzaSECRET');
  });

  it('unlocks encrypted keys on startup so they are usable', async () => {
    localStorage.setItem(STORAGE, JSON.stringify([storedKey({ key: enc('AIzaFromDisk') })]));
    render(<App />);
    await waitFor(() => expect(decryptSecrets).toHaveBeenCalledWith([enc('AIzaFromDisk')]));

    await userEvent.click(nav('Key Vault'));
    const test = await screen.findByTitle('Test key connection');
    await waitFor(() => expect(test).toBeEnabled());
  });

  it('survives a reload: add a key, re-mount, the key is still there', async () => {
    const first = render(<App />);
    await addKey('AIzaSyPersistMe1234');
    await waitFor(() => expect(localStorage.getItem(STORAGE)).toContain('enc:v1:'));
    first.unmount();

    render(<App />);
    await userEvent.click(nav('Home'));
    expect(await screen.findByText('1 key')).toBeInTheDocument();
  });

  it('warns about keys that cannot be decrypted on this device and keeps them stored', async () => {
    const orphan = 'enc:v1:orphan-token';
    localStorage.setItem(STORAGE, JSON.stringify([storedKey({ key: orphan })]));
    render(<App />);
    await userEvent.click(nav('Key Vault'));

    expect(await screen.findByText(/couldn't be decrypted on this device/)).toBeInTheDocument();
    expect(screen.getByTitle('Test key connection')).toBeDisabled();

    // Another change must not drop or corrupt the orphaned token.
    await userEvent.type(screen.getByPlaceholderText('Paste your API key here...'), 'AIzaSyAnotherKey12345');
    await userEvent.click(screen.getByRole('button', { name: /Save/i }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE)!)).toHaveLength(2));
    expect(JSON.parse(localStorage.getItem(STORAGE)!).some((k: { key: string }) => k.key === orphan)).toBe(true);
  });

  it('never falls back to plaintext when encryption fails, and says so', async () => {
    encryptSecrets.mockRejectedValueOnce(new Error('Could not read the credential store'));
    render(<App />);
    await addKey('AIzaSyShouldNotBeWritten');

    expect(await screen.findByText(/could not be saved securely/)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE) ?? '').not.toContain('AIzaSyShouldNotBeWritten');
  });

  it('removes a deleted key from storage', async () => {
    localStorage.setItem(STORAGE, JSON.stringify([storedKey({ key: enc('AIzaDeleteMe') })]));
    render(<App />);
    await userEvent.click(nav('Key Vault'));
    await waitFor(() => expect(screen.getByTitle('Test key connection')).toBeEnabled());
    await userEvent.click(screen.getByTitle(/Delete/i));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE)!)).toHaveLength(0));
  });
});
