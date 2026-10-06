import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';

vi.mock('./files', () => ({ copyText: vi.fn(), downloadTextFile: vi.fn() }));

import { copyText } from './files';
import { CopyStatusIcon, useCopyFeedback } from './useCopy';

afterEach(() => vi.useRealTimers());

describe('useCopyFeedback', () => {
  it('reports success only for the button that was used', async () => {
    vi.mocked(copyText).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useCopyFeedback());
    await act(async () => {
      await result.current.copy('text', 'a');
    });
    expect(copyText).toHaveBeenCalledWith('text');
    expect(result.current.statusOf('a')).toBe('copied');
    expect(result.current.statusOf('b')).toBe('idle');
  });

  it('reports failure instead of success when the clipboard refuses', async () => {
    vi.mocked(copyText).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useCopyFeedback());
    await act(async () => {
      await result.current.copy('text', 'a');
    });
    expect(result.current.statusOf('a')).toBe('failed');
  });

  it('goes back to idle after the delay', async () => {
    vi.useFakeTimers();
    vi.mocked(copyText).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useCopyFeedback(1000));
    await act(async () => {
      await result.current.copy('text', 'a');
    });
    expect(result.current.statusOf('a')).toBe('copied');
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.statusOf('a')).toBe('idle');
  });
});

describe('CopyStatusIcon', () => {
  it('draws a different icon for each status', () => {
    const { container, rerender } = render(<CopyStatusIcon status="idle" />);
    const idle = container.innerHTML;
    rerender(<CopyStatusIcon status="copied" />);
    const copied = container.innerHTML;
    rerender(<CopyStatusIcon status="failed" />);
    const failed = container.innerHTML;
    expect(new Set([idle, copied, failed]).size).toBe(3);
    expect(copied).toContain('emerald');
    expect(failed).toContain('rose');
  });
});
