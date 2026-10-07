import { afterEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: (...a: unknown[]) => invokeMock(...a) }));
vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn() }));
const listenMock = vi.fn();
vi.mock('@tauri-apps/api/event', () => ({ listen: (...a: unknown[]) => listenMock(...a) }));

import {
  askAdvisor,
  cancelSetupInstall,
  detectSetupTools,
  installSetupTool,
  listSetupRecipes,
  decryptBackup,
  decryptSecrets,
  encryptBackup,
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
  listenMock.mockReset();
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

describe('backup encryption wrappers', () => {
  it('send the text and passphrase the Rust commands expect', async () => {
    inTauri();
    invokeMock.mockResolvedValue('{"format":"localmind-encrypted-backup"}');
    await expect(encryptBackup('{"a":1}', 'a passphrase')).resolves.toContain('encrypted-backup');
    expect(invokeMock).toHaveBeenCalledWith('encrypt_backup', { text: '{"a":1}', passphrase: 'a passphrase' });
    invokeMock.mockResolvedValue('{"a":1}');
    await expect(decryptBackup('file text', 'a passphrase')).resolves.toBe('{"a":1}');
    expect(invokeMock).toHaveBeenCalledWith('decrypt_backup', { text: 'file text', passphrase: 'a passphrase' });
  });

  it('surface the Rust error message, such as a wrong passphrase', async () => {
    inTauri();
    invokeMock.mockRejectedValue('Wrong passphrase, or the file has been changed.');
    await expect(decryptBackup('x', 'y')).rejects.toThrow('Wrong passphrase');
  });

  it('refuse in a plain browser instead of writing an unprotected file', async () => {
    await expect(encryptBackup('x', 'long enough')).rejects.toThrow('needs the LocalMind desktop app');
  });
});

describe('setup wrappers', () => {
  it('throw the desktop-app message outside Tauri', async () => {
    await expect(listSetupRecipes()).rejects.toThrow('Tool setup needs the LocalMind desktop app.');
    await expect(detectSetupTools(['ollama'])).rejects.toThrow(/desktop app/);
    await expect(installSetupTool('ollama', vi.fn())).rejects.toThrow(/desktop app/);
    await expect(cancelSetupInstall()).rejects.toThrow(/desktop app/);
    expect(invokeMock).not.toHaveBeenCalled();
    expect(listenMock).not.toHaveBeenCalled();
  });

  it('list and detect call the right commands', async () => {
    inTauri();
    invokeMock.mockResolvedValueOnce([{ id: 'ollama' }]);
    expect(await listSetupRecipes()).toEqual([{ id: 'ollama' }]);
    expect(invokeMock).toHaveBeenLastCalledWith('list_setup_recipes', undefined);
    invokeMock.mockResolvedValueOnce([]);
    await detectSetupTools(['ollama', 'gemini-cli']);
    expect(invokeMock).toHaveBeenLastCalledWith('detect_setup_tools', { ids: ['ollama', 'gemini-cli'] });
  });

  it("install sends only the recipe id, forwards this tool's output lines and stops listening afterwards", async () => {
    inTauri();
    const unlisten = vi.fn();
    let handler: (e: { payload: { id: string; line: string } }) => void = () => {};
    listenMock.mockImplementation(async (_name: string, h: typeof handler) => {
      handler = h;
      return unlisten;
    });
    invokeMock.mockImplementation(async () => {
      handler({ payload: { id: 'ollama', line: 'downloading' } });
      handler({ payload: { id: 'other', line: 'not mine' } });
      return 'Ollama was installed.';
    });
    const lines: string[] = [];
    expect(await installSetupTool('ollama', (l) => lines.push(l))).toBe('Ollama was installed.');
    expect(listenMock.mock.calls[0][0]).toBe('setup-output');
    expect(invokeMock).toHaveBeenCalledWith('install_setup_tool', { id: 'ollama' });
    expect(lines).toEqual(['downloading']);
    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  it('install still stops listening when it fails', async () => {
    inTauri();
    const unlisten = vi.fn();
    listenMock.mockResolvedValue(unlisten);
    invokeMock.mockRejectedValue('Install cancelled.');
    await expect(installSetupTool('ollama', vi.fn())).rejects.toThrow('Install cancelled.');
    expect(unlisten).toHaveBeenCalledTimes(1);
  });
});
