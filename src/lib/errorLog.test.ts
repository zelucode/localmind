import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./backend', () => ({ logEvent: vi.fn().mockResolvedValue(undefined) }));
const tauri = { on: false };
vi.mock('./tauri', () => ({ isTauri: () => tauri.on }));

import { logEvent } from './backend';
import { describeForLog, installGlobalErrorLogging, logError, logInfo, logWarn, resetLogForwarding } from './errorLog';

const sent = vi.mocked(logEvent);

beforeEach(() => {
  tauri.on = false;
  sent.mockClear();
  sent.mockResolvedValue(undefined);
  resetLogForwarding();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('errorLog console output', () => {
  it('logWarn writes a tagged warning with the error', () => {
    const err = new Error('x');
    logWarn('theme', 'dropped a preset', err);
    expect(console.warn).toHaveBeenCalledWith('[theme] dropped a preset', err);
  });

  it('logError writes a tagged error with the error', () => {
    logError('boot', 'crashed', 'why');
    expect(console.error).toHaveBeenCalledWith('[boot] crashed', 'why');
  });
});

describe('errorLog forwarding to app.log', () => {
  it('sends nothing in a plain browser', () => {
    logError('boot', 'crashed');
    expect(sent).not.toHaveBeenCalled();
  });

  it('sends level, source and message inside the desktop app, with the error detail', () => {
    tauri.on = true;
    logInfo('ui', 'started');
    logWarn('theme', 'dropped a preset', new Error('bad hex'));
    logError('boot', 'crashed', 'why');
    expect(sent).toHaveBeenNthCalledWith(1, 'info', 'ui', 'started');
    expect(sent.mock.calls[1][0]).toBe('warn');
    expect(sent.mock.calls[1][2]).toMatch(/^dropped a preset \(Error: bad hex/);
    expect(sent).toHaveBeenNthCalledWith(3, 'error', 'boot', 'crashed (why)');
  });

  it('holds back an identical message repeated straight away', () => {
    tauri.on = true;
    logError('loop', 'same');
    logError('loop', 'same');
    logError('loop', 'different');
    expect(sent).toHaveBeenCalledTimes(2);
  });

  it('stops forwarding after a session cap so a runaway loop cannot fill the log', () => {
    tauri.on = true;
    for (let i = 0; i < 400; i++) logError('loop', `event ${i}`);
    expect(sent.mock.calls.length).toBe(300);
  });

  it('never throws when the backend call fails', async () => {
    tauri.on = true;
    sent.mockRejectedValue(new Error('backend gone'));
    expect(() => logError('x', 'y')).not.toThrow();
    await Promise.resolve();
  });
});

describe('describeForLog', () => {
  it('describes errors, strings, objects and nothing', () => {
    expect(describeForLog(undefined)).toBe('');
    expect(describeForLog('text')).toBe('text');
    expect(describeForLog({ a: 1 })).toBe('{"a":1}');
    expect(describeForLog(new TypeError('nope'))).toMatch(/^TypeError: nope/);
  });

  it('survives values that cannot be turned into JSON', () => {
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    expect(describeForLog(loop)).toBe('[object Object]');
  });
});

describe('installGlobalErrorLogging', () => {
  it('logs uncaught errors and unhandled rejections, and can be removed', () => {
    tauri.on = true;
    const remove = installGlobalErrorLogging(window);
    window.dispatchEvent(new ErrorEvent('error', { message: 'boom', error: new Error('boom') }));
    const rejection = new Event('unhandledrejection') as Event & { reason?: unknown };
    rejection.reason = 'denied';
    window.dispatchEvent(rejection);
    expect(sent.mock.calls.map((c) => [c[0], c[1]])).toEqual([
      ['error', 'window'],
      ['error', 'promise'],
    ]);
    remove();
    sent.mockClear();
    resetLogForwarding();
    window.dispatchEvent(new ErrorEvent('error', { message: 'later' }));
    expect(sent).not.toHaveBeenCalled();
  });
});
