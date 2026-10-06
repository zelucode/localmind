import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

afterEach(() => vi.useRealTimers());

describe('ConfirmDeleteButton', () => {
  it('does not delete on the first click, only on the second', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteButton name="My Tool" onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete My Tool' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete My Tool' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Delete My Tool' })).toBeInTheDocument();
  });

  it('backs out when it loses focus', async () => {
    const onConfirm = vi.fn();
    render(
      <>
        <ConfirmDeleteButton name="X" onConfirm={onConfirm} />
        <button>elsewhere</button>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete X' }));
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.getByRole('button', { name: 'Delete X' })).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disarms by itself after a few seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onConfirm = vi.fn();
    render(<ConfirmDeleteButton name="X" onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete X' }));
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4500);
    });
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
