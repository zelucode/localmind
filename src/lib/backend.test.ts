import { afterEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: (...a: unknown[]) => invokeMock(...a) }));
vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn() }));

import {
  askAdvisor,
  decryptSecrets,
  encryptSecrets,
  getLogInfo,
  indexProbeResults,
  logEvent,
  previewDiagnostics,
  probePorts,
  saveDiagnostics,
  verifyApiKey,
} from './backend';

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  invokeMock.mockReset();
});

function inTauri() {
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
}

describe('backend wrappers send the shapes the Rust commands expect', () => {
  it('probePorts', async () => {
    inTauri();
    invokeMock.mockResolvedValue([{ port: 8000, online: true, latencyMs: 2 }]);
    await probePorts([8000, 11434]);
    expect(invokeMock).toHaveBeenCalledWith('probe_ports', { ports: [8000, 11434] });
  });

  it('verifyApiKey wraps provider and key in `request`', async () => {
    inTauri();
    invokeMock.mockResolvedValue({ status: 'valid', message: 'ok' });
    await expect(verifyApiKey('groq', 'gsk_abc')).resolves.toEqual({ status: 'valid', message: 'ok' });
    expect(invokeMock).toHaveBeenCalledWith('verify_api_key', { request: { provider: 'groq', key: 'gsk_abc' } });
  });

  it('askAdvisor sends camelCase apiKey', async () => {
    inTauri();
    invokeMock.mockResolvedValue('answer');
    await expect(askAdvisor('how?', 'KEY')).resolves.toBe('answer');
    expect(invokeMock).toHaveBeenCalledWith('ask_advisor', { request: { query: 'how?', apiKey: 'KEY' } });
  });

  it('encryptSecrets and decryptSecrets pass plain arrays', async () => {
    inTauri();
    invokeMock.mockResolvedValue(['enc:v1:abc']);
    await expect(encryptSecrets(['k'])).resolves.toEqual(['enc:v1:abc']);
    expect(invokeMock).toHaveBeenCalledWith('encrypt_secrets', { values: ['k'] });
    invokeMock.mockResolvedValue([{ value: 'k', error: null }]);
    await decryptSecrets(['enc:v1:abc']);
    expect(invokeMock).toHaveBeenLastCalledWith('decrypt_secrets', { tokens: ['enc:v1:abc'] });
  });

  it('every wrapper refuses to run in a plain browser', async () => {
    await expect(probePorts([1])).rejects.toThrow(/desktop app/);
    await expect(verifyApiKey('groq', 'k')).rejects.toThrow(/desktop app/);
    await expect(askAdvisor('q', 'k')).rejects.toThrow(/desktop app/);
    await expect(encryptSecrets(['k'])).rejects.toThrow(/desktop app/);
    await expect(decryptSecrets(['t'])).rejects.toThrow(/desktop app/);
    expect(invokeMock).not.toHaveBeenCalled();
  });
});

describe('indexProbeResults', () => {
  it('keys results by port', () => {
    const map = indexProbeResults([
      { port: 1, online: true, latencyMs: 3 },
      { port: 2, online: false, latencyMs: null },
    ]);
    expect(map.get(1)?.online).toBe(true);
    expect(map.get(2)?.online).toBe(false);
    expect(map.get(3)).toBeUndefined();
  });
});

describe('logging and diagnostics wrappers', () => {
  it('send the shapes the Rust commands expect', async () => {
    inTauri();
    invokeMock.mockResolvedValue(undefined);
    await logEvent('warn', 'theme', 'dropped a preset');
    expect(invokeMock).toHaveBeenCalledWith('log_event', { level: 'warn', source: 'theme', message: 'dropped a preset' });
    invokeMock.mockResolvedValue({ dir: 'C:/logs', file: 'C:/logs/app.log' });
    await expect(getLogInfo()).resolves.toEqual({ dir: 'C:/logs', file: 'C:/logs/app.log' });
    expect(invokeMock).toHaveBeenCalledWith('log_info', undefined);
    invokeMock.mockResolvedValue('text');
    await expect(previewDiagnostics()).resolves.toBe('text');
    expect(invokeMock).toHaveBeenCalledWith('preview_diagnostics', undefined);
    invokeMock.mockResolvedValue('C:/Downloads/f.txt');
    await expect(saveDiagnostics()).resolves.toBe('C:/Downloads/f.txt');
    expect(invokeMock).toHaveBeenCalledWith('save_diagnostics', undefined);
  });

  it('refuse in a plain browser', async () => {
    await expect(previewDiagnostics()).rejects.toThrow('needs the LocalMind desktop app');
  });
});
