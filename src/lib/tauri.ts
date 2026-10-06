import { invoke } from '@tauri-apps/api/core';
import { openUrl, revealItemInDir } from '@tauri-apps/plugin-opener';

/** True when running inside the Tauri webview (false in a plain browser via `pnpm dev`). */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Thrown when a feature needs the Rust backend but the app runs in a plain browser. */
export class BackendUnavailableError extends Error {
  constructor(feature = 'This feature') {
    super(`${feature} needs the LocalMind desktop app.`);
    this.name = 'BackendUnavailableError';
  }
}

/** Call a Rust command. Rust-side `Err(String)` values surface as `Error` with that message. */
export async function callBackend<T>(command: string, args?: Record<string, unknown>, feature?: string): Promise<T> {
  if (!isTauri()) throw new BackendUnavailableError(feature);
  try {
    return await invoke<T>(command, args);
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/** Open a link in the system browser (the webview itself should never navigate away from the app). */
export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    try {
      await openUrl(url);
      return;
    } catch {
      // fall through to the browser path
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Show a file or folder in the system file manager. Throws outside the desktop app. */
export async function revealInFolder(path: string): Promise<void> {
  if (!isTauri()) throw new BackendUnavailableError('Showing a file in its folder');
  await revealItemInDir(path);
}
