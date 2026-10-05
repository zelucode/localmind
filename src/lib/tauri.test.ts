import { afterEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
const openUrlMock = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({ invoke: (...a: unknown[]) => invokeMock(...a) }));
vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: (...a: unknown[]) => openUrlMock(...a) }));

import { BackendUnavailableError, callBackend, isTauri, openExternal } from './tauri';

function setTauri(on: boolean) {
  if (on) (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  else delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}

afterEach(() => {
  setTauri(false);
  invokeMock.mockReset();
  openUrlMock.mockReset();
});

describe('isTauri', () => {
  it('is false in a plain browser and true inside the Tauri webview', () => {
    expect(isTauri()).toBe(false);
    setTauri(true);
    expect(isTauri()).toBe(true);
  });
});

describe('callBackend', () => {
  it('rejects with BackendUnavailableError outside Tauri, naming the feature', async () => {
    await expect(callBackend('probe_ports', {}, 'Scanning local ports')).rejects.toMatchObject({
      name: 'BackendUnavailableError',
      message: 'Scanning local ports needs the LocalMind desktop app.',
    });
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('forwards command and args to invoke inside Tauri', async () => {
    setTauri(true);
    invokeMock.mockResolvedValue([1]);
    await expect(callBackend('probe_ports', { ports: [1] })).resolves.toEqual([1]);
    expect(invokeMock).toHaveBeenCalledWith('probe_ports', { ports: [1] });
  });

  it('turns a Rust string error into an Error with that message', async () => {
    setTauri(true);
    invokeMock.mockRejectedValue('Port 0 is not valid.');
    const err = await callBackend('probe_ports', {}).catch((e: Error) => e) as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Port 0 is not valid.');
    expect(err).not.toBeInstanceOf(BackendUnavailableError);
  });
});

describe('openExternal', () => {
  it('uses the opener plugin inside Tauri', async () => {
    setTauri(true);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    await openExternal('https://example.com');
    expect(openUrlMock).toHaveBeenCalledWith('https://example.com');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('falls back to window.open in a browser', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    await openExternal('https://example.com');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    expect(openUrlMock).not.toHaveBeenCalled();
  });

  it('falls back to window.open when the plugin fails', async () => {
    setTauri(true);
    openUrlMock.mockRejectedValue(new Error('denied'));
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    await openExternal('https://example.com');
    expect(openSpy).toHaveBeenCalled();
  });
});
