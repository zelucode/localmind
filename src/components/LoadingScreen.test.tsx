import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('leaves the title bar uncovered so the window can always be closed or moved', () => {
    render(<LoadingScreen onFinish={() => {}} durationMs={5000} />);
    const screenEl = document.getElementById('app-loading-screen')!;
    expect(screenEl).toHaveClass('top-11');
    expect(screenEl).not.toHaveClass('inset-0');
  });

  it('shows the tagline and a skip hint', () => {
    render(<LoadingScreen onFinish={() => {}} durationMs={5000} />);
    expect(screen.getByText('Your private AI hub, always nearby.')).toBeInTheDocument();
    expect(screen.getByText(/Press Space to skip/)).toBeInTheDocument();
  });

  it.each([['{Escape}'], [' '], ['{Enter}']])('can be skipped with %s', async (key) => {
    const onFinish = vi.fn();
    render(<LoadingScreen onFinish={onFinish} durationMs={5000} />);
    await userEvent.keyboard(key);
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
  });

  it('can be skipped by clicking', async () => {
    const onFinish = vi.fn();
    render(<LoadingScreen onFinish={onFinish} durationMs={5000} />);
    await userEvent.click(document.getElementById('app-loading-screen')!);
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
  });

  it('finishes on its own after the duration', async () => {
    const onFinish = vi.fn();
    render(<LoadingScreen onFinish={onFinish} durationMs={50} />);
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1), { timeout: 2000 });
  });
});
