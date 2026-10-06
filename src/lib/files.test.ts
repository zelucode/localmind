import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText, downloadTextFile } from './files';

afterEach(() => vi.restoreAllMocks());

describe('copyText', () => {
  it('resolves true when the clipboard accepts the text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await expect(copyText('hi')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hi');
  });

  it('resolves false instead of throwing when the clipboard refuses', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    });
    await expect(copyText('hi')).resolves.toBe(false);
  });
});

describe('downloadTextFile', () => {
  it('clicks a temporary link with the file name and cleans up', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadTextFile('a.csv', 'x', 'text/csv', true);
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
