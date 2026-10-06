import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));

import { openExternal } from '../lib/tauri';
import { IDEConfigExporterModal } from './IDEConfigExporterModal';
import { StoredApiKey } from '../types';

const groqKey: StoredApiKey = {
  id: 'k1',
  provider: 'groq',
  providerName: 'Groq Cloud',
  key: 'gsk_vault_key',
  label: 'My Groq',
  createdAt: '2026-01-01',
  freeTierNotes: '',
  getKeyUrl: '',
  lastTestedStatus: 'unknown',
};

function setup(props: Partial<React.ComponentProps<typeof IDEConfigExporterModal>> = {}) {
  return render(<IDEConfigExporterModal inline isOpen onClose={() => {}} savedKeys={[]} {...props} />);
}

const snippet = () => document.querySelector('pre')!.textContent!;

afterEach(() => vi.restoreAllMocks());

describe('IDEConfigExporterModal', () => {
  it('starts on the opening provider with that provider\'s default model, not Gemini\'s', () => {
    setup({ initialProvider: 'groq' });
    expect(snippet()).toContain('llama-3.3-70b-versatile');
    expect(snippet()).not.toContain('gemini-2.5-flash');
  });

  it('falls back to Gemini for an unknown initial provider', () => {
    setup({ initialProvider: 'nope' });
    expect(snippet()).toContain('gemini-2.5-flash');
  });

  it('hides the vault key on screen and reveals it with the eye button', async () => {
    setup({ initialProvider: 'groq', savedKeys: [groqKey] });
    expect(snippet()).not.toContain('gsk_vault_key');
    expect(snippet()).toContain('••••');
    await userEvent.click(screen.getByRole('button', { name: /show key in config/i }));
    expect(snippet()).toContain('gsk_vault_key');
    await userEvent.click(screen.getByRole('button', { name: /hide key in config/i }));
    expect(snippet()).not.toContain('gsk_vault_key');
  });

  it('copies the real key even while it is hidden on screen', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setup({ initialProvider: 'groq', savedKeys: [groqKey] });
    await userEvent.click(screen.getByRole('button', { name: /copy config/i }));
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).toContain('gsk_vault_key');
    expect(writeText.mock.calls[0][0]).not.toContain('••••');
  });

  it('masks a pasted key in the input and in the config, with an eye toggle for each', async () => {
    setup({ initialProvider: 'groq' });
    const input = screen.getByLabelText(/api key/i);
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.type(input, 'gsk_typed_secret');
    expect(snippet()).not.toContain('gsk_typed_secret');
    await userEvent.click(screen.getByRole('button', { name: 'Show key' }));
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Hide key' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('has nothing to hide for a placeholder or a local server', () => {
    setup({ initialProvider: 'ollama' });
    expect(screen.queryByRole('button', { name: /show key in config/i })).not.toBeInTheDocument();
    expect(snippet()).not.toContain('••••');
  });

  it('switches to a placeholder key on demand', async () => {
    setup({ initialProvider: 'groq', savedKeys: [groqKey] });
    await userEvent.click(screen.getByRole('button', { name: /using actual key/i }));
    expect(snippet()).toContain('YOUR_GROQ_API_KEY');
    expect(screen.queryByRole('button', { name: /show key in config/i })).not.toBeInTheDocument();
  });

  it('opens the "Get Key" link through openExternal', async () => {
    setup({ initialProvider: 'groq' });
    await userEvent.click(screen.getByRole('link', { name: /get key/i }));
    expect(openExternal).toHaveBeenCalledWith('https://console.groq.com/keys');
  });

  it('says "Copied" only when the clipboard write succeeded', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setup();
    await userEvent.click(screen.getByRole('button', { name: /copy config/i }));
    expect(writeText).toHaveBeenCalledWith(snippet());
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument();
  });

  it('reports a failed copy instead of claiming success', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    setup();
    await userEvent.click(screen.getByRole('button', { name: /copy config/i }));
    expect(await screen.findByText(/copy failed/i)).toBeInTheDocument();
    expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument();
  });
});
