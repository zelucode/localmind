import { isTauri } from './tauri';
import { logEvent } from './backend';

type Level = 'info' | 'warn' | 'error';

/** Most events sent to app.log in one session, and how long an identical message is held back. */
const MAX_FORWARDED = 300;
const DUPLICATE_WINDOW_MS = 5000;

let forwarded = 0;
let lastKey = '';
let lastAt = 0;

/** One line about an error: its name and message, plus the first few stack frames. */
export function describeForLog(err: unknown): string {
  if (err === undefined || err === null) return '';
  if (err instanceof Error) {
    const frames = (err.stack ?? '').split('\n').slice(1, 4).map((l) => l.trim()).filter(Boolean);
    return `${err.name}: ${err.message}${frames.length ? ` | ${frames.join(' | ')}` : ''}`;
  }
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/** Send an event to app.log (desktop app only). Never throws and never logs its own failures. */
function forward(level: Level, category: string, message: string, err?: unknown): void {
  if (!isTauri() || forwarded >= MAX_FORWARDED) return;
  const detail = describeForLog(err);
  const text = detail ? `${message} (${detail})` : message;
  const now = Date.now();
  const key = `${level}|${category}|${text}`;
  if (key === lastKey && now - lastAt < DUPLICATE_WINDOW_MS) return;
  lastKey = key;
  lastAt = now;
  forwarded++;
  void logEvent(level, category, text).catch(() => {});
}

export function logInfo(category: string, message: string) {
  console.info(`[${category}] ${message}`);
  forward('info', category, message);
}

export function logWarn(category: string, message: string, err?: unknown) {
  console.warn(`[${category}] ${message}`, err);
  forward('warn', category, message, err);
}

export function logError(category: string, message: string, err?: unknown) {
  console.error(`[${category}] ${message}`, err);
  forward('error', category, message, err);
}

/** Log errors that React never sees (event handlers, timers, async code). Returns a function that removes the listeners. */
export function installGlobalErrorLogging(target: Window = window): () => void {
  const onError = (e: ErrorEvent) => logError('window', e.message || 'Uncaught error', e.error);
  const onRejection = (e: PromiseRejectionEvent) => logError('promise', 'Unhandled promise rejection', e.reason);
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}

/** For tests: forget what was forwarded. */
export function resetLogForwarding(): void {
  forwarded = 0;
  lastKey = '';
  lastAt = 0;
}
