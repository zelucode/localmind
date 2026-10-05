import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The watchdog is an inline script in index.html (it has to work when the app bundle never loads),
 * so these tests extract that exact script and run it against a fake splash.
 */
const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
const match = html.match(/<script id="boot-watchdog">([\s\S]*?)<\/script>/);
const watchdog = match ? match[1] : '';

function runWatchdog() {
  new Function(watchdog)();
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="root"><div id="boot-splash"></div></div>';
});

afterEach(() => {
  vi.useRealTimers();
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  document.body.innerHTML = '';
});

describe('index.html boot watchdog', () => {
  it('exists in index.html', () => {
    expect(watchdog.length).toBeGreaterThan(100);
  });

  it('stays quiet while startup is within the time limit', () => {
    runWatchdog();
    vi.advanceTimersByTime(9000);
    expect(document.getElementById('boot-stuck')).toBeNull();
  });

  it('offers Reload and Close when the splash is still there after the limit', () => {
    runWatchdog();
    vi.advanceTimersByTime(10000);
    const box = document.getElementById('boot-stuck')!;
    expect(box).toBeInTheDocument();
    expect(box).toHaveAttribute('role', 'alert');
    expect(box.textContent).toContain('taking longer than expected');
    const labels = Array.from(box.querySelectorAll('button')).map((b) => b.textContent);
    expect(labels).toEqual(['Reload', 'Close']);
  });

  it('does nothing when the app already replaced the splash', () => {
    runWatchdog();
    document.getElementById('root')!.innerHTML = '<div>app</div>';
    vi.advanceTimersByTime(20000);
    expect(document.getElementById('boot-stuck')).toBeNull();
  });

  it('only adds the message once', () => {
    runWatchdog();
    runWatchdog();
    vi.advanceTimersByTime(10000);
    expect(document.querySelectorAll('#boot-stuck')).toHaveLength(1);
  });

  it('Close asks Tauri to close the main window', () => {
    const invoke = vi.fn();
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = { invoke };
    runWatchdog();
    vi.advanceTimersByTime(10000);
    (document.querySelectorAll('#boot-stuck button')[1] as HTMLButtonElement).click();
    expect(invoke).toHaveBeenCalledWith('plugin:window|close', { label: 'main' });
  });

  it('Close falls back to window.close() outside Tauri', () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    runWatchdog();
    vi.advanceTimersByTime(10000);
    (document.querySelectorAll('#boot-stuck button')[1] as HTMLButtonElement).click();
    expect(close).toHaveBeenCalled();
  });

  it('keeps a draggable strip at the top of the window from the start', () => {
    expect(html).toMatch(/<div data-tauri-drag-region style="position: fixed; top: 0;/);
  });
});
