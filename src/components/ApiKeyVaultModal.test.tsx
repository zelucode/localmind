import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/backend')>()),
  verifyApiKey: vi.fn(),
}));

import { verifyApiKey } from '../lib/backend';
import { BackendUnavailableError } from '../lib/tauri';
import { ApiKeyVaultModal } from './ApiKeyVaultModal';
import { StoredApiKey } from '../types';

const verify = vi.mocked(verifyApiKey);

const key: StoredApiKey = {
  id: 'k1',
  provider: 'groq',
  providerName: 'Groq Cloud',
  key: 'gsk_abcdefghijklmnop',
  label: 'My Groq',
  createdAt: '2026-01-01',
  freeTierNotes: '30 RPM',
  getKeyUrl: 'https://console.groq.com',
  lastTestedStatus: 'unknown',
};

function setup(overrides: Partial<React.ComponentProps<typeof ApiKeyVaultModal>> = {}) {
  const props = {
    inline: true,
    isOpen: true,
    onClose: vi.fn(),
    keys: [key],
    onAddKey: vi.fn(),
    onDeleteKey: vi.fn(),
    onKeyTested: vi.fn(),
    ...overrides,
  };
  render(<ApiKeyVaultModal {...props} />);
  return props;
}

describe('ApiKeyVaultModal key testing', () => {
  it('sends the provider and key to the backend and shows a valid result', async () => {
    verify.mockResolvedValue({ status: 'valid', message: 'Key accepted by the provider.' });
    const props = setup();
    await userEvent.click(screen.getByTitle('Test key connection'));

    expect(verify).toHaveBeenCalledWith('groq', 'gsk_abcdefghijklmnop');
    expect(await screen.findByRole('status')).toHaveTextContent('Key accepted by the provider.');
    expect(props.onKeyTested).toHaveBeenCalledWith('k1', 'valid');
  });

  it('records a rejected key as invalid', async () => {
    verify.mockResolvedValue({ status: 'invalid', message: 'The provider rejected this key.' });
    const props = setup();
    await userEvent.click(screen.getByTitle('Test key connection'));

    expect(await screen.findByRole('status')).toHaveTextContent('rejected');
    expect(props.onKeyTested).toHaveBeenCalledWith('k1', 'invalid');
  });

  it('does not change the stored status when the key could not be checked', async () => {
    verify.mockResolvedValue({ status: 'unsupported', message: 'Verification isn\'t available for this provider yet.' });
    const props = setup();
    await userEvent.click(screen.getByTitle('Test key connection'));

    expect(await screen.findByRole('status')).toHaveTextContent("isn't available");
    expect(props.onKeyTested).not.toHaveBeenCalled();
  });

  it('explains when the desktop backend is not available', async () => {
    verify.mockRejectedValue(new BackendUnavailableError('Verifying keys'));
    const props = setup();
    await userEvent.click(screen.getByTitle('Test key connection'));

    expect(await screen.findByRole('status')).toHaveTextContent('Verifying keys needs the LocalMind desktop app.');
    expect(props.onKeyTested).not.toHaveBeenCalled();
  });

  it('never marks a key valid just because it is long', async () => {
    verify.mockResolvedValue({ status: 'error', message: 'Could not reach the provider.' });
    const props = setup();
    await userEvent.click(screen.getByTitle('Test key connection'));
    await screen.findByRole('status');
    expect(props.onKeyTested).not.toHaveBeenCalled();
  });

  it('renders as a page without a close button in inline mode', () => {
    setup();
    expect(document.getElementById('btn-close-key-vault')).toHaveClass('hidden');
  });
});
