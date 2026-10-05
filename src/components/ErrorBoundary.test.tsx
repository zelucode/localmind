import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const closeMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    close: closeMock,
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false),
    onResized: vi.fn().mockResolvedValue(() => {}),
  }),
}));

import { ErrorBoundary, describeError } from './ErrorBoundary';

let shouldThrow = true;
const Bomb: React.FC = () => {
  if (shouldThrow) throw new Error('Boom: cannot read properties of undefined');
  return <div>All good</div>;
};

beforeEach(() => {
  shouldThrow = true;
  closeMock.mockClear();
  // React logs caught render errors; keep test output readable.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary', () => {
  it('renders children when nothing is wrong', () => {
    shouldThrow = false;
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a recovery screen with the error message instead of a blank window', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getAllByText(/Boom: cannot read properties of undefined/).length).toBeGreaterThan(0);
    expect(screen.getByText(/saved keys are not\s+affected/)).toBeInTheDocument();
  });

  it('keeps working window controls on the crash screen', async () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    // minimize, maximize and close caption buttons are always reachable
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(closeMock).toHaveBeenCalled();
  });

  it('closes the app from the Close app button', async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole('button', { name: /Close app/ }));
    expect(closeMock).toHaveBeenCalled();
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  it('recovers with Try again once the cause is gone', async () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(await screen.findByText('All good')).toBeInTheDocument();
  });

  it('stays on the crash screen if Try again fails again', async () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('reloads the page from Reload app', async () => {
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload } });
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole('button', { name: /Reload app/ }));
    expect(reload).toHaveBeenCalled();
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('copies a crash report to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole('button', { name: /Copy details/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain('LocalMind crash report');
    expect(writeText.mock.calls[0][0]).toContain('Boom: cannot read properties of undefined');
    expect(await screen.findByRole('button', { name: /Copied/ })).toBeInTheDocument();
  });

  it('survives a blocked clipboard', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    await userEvent.click(screen.getByRole('button', { name: /Copy details/ }));
    expect(screen.getByRole('button', { name: /Copy details/ })).toBeInTheDocument();
  });
});

describe('describeError', () => {
  it('includes time, message, stack and component stack', () => {
    const err = new Error('bad thing');
    const text = describeError(err, '\n    at Foo');
    expect(text).toContain('LocalMind crash report');
    expect(text).toContain('Error: Error: bad thing');
    expect(text).toContain('Stack:');
    expect(text).toContain('Component stack:');
    expect(text).toContain('at Foo');
  });

  it('copes with errors that have no stack', () => {
    const err = new Error('no stack');
    err.stack = undefined;
    expect(describeError(err)).not.toContain('Stack:');
  });
});
