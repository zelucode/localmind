import { afterEach, describe, expect, it, vi } from 'vitest';
import { logError, logWarn } from './errorLog';

afterEach(() => vi.restoreAllMocks());

describe('errorLog', () => {
  it('logWarn writes a tagged warning with the error', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = new Error('x');
    logWarn('theme', 'dropped a preset', err);
    expect(warn).toHaveBeenCalledWith('[theme] dropped a preset', err);
  });

  it('logError writes a tagged error with the error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('boot', 'crashed', 'why');
    expect(error).toHaveBeenCalledWith('[boot] crashed', 'why');
  });
});
