import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const win = {
  minimize: vi.fn().mockResolvedValue(undefined),
  toggleMaximize: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  isMaximized: vi.fn().mockResolvedValue(false),
  onResized: vi.fn().mockResolvedValue(() => {}),
};
let available = true;
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => {
    if (!available) throw new Error('no tauri');
    return win;
  },
}));

import { TitleBarDragRegion, WindowControls, closeWindow } from './WindowControls';

beforeEach(() => {
  available = true;
  for (const fn of [win.minimize, win.toggleMaximize, win.close]) fn.mockClear();
  win.isMaximized.mockResolvedValue(false);
});

describe('WindowControls', () => {
  it('minimizes, maximizes and closes the window', async () => {
    render(<WindowControls />);
    await userEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    await userEvent.click(screen.getByRole('button', { name: 'Maximize' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(win.minimize).toHaveBeenCalledTimes(1);
    expect(win.toggleMaximize).toHaveBeenCalledTimes(1);
    expect(win.close).toHaveBeenCalledTimes(1);
  });

  it('offers Restore instead of Maximize when the window is already maximized', async () => {
    win.isMaximized.mockResolvedValue(true);
    render(<WindowControls />);
    expect(await screen.findByRole('button', { name: 'Restore' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Maximize' })).not.toBeInTheDocument();
  });

  it('does not throw and still renders when there is no desktop window (plain browser)', async () => {
    available = false;
    render(<WindowControls />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument());
  });

  it('closeWindow closes the window, and is a no-op outside the desktop app', async () => {
    await closeWindow();
    expect(win.close).toHaveBeenCalledTimes(1);
    available = false;
    await expect(closeWindow()).resolves.toBeUndefined();
  });

  it('the drag region toggles maximize on double click and is marked as a Tauri drag region', async () => {
    render(<TitleBarDragRegion className="x">title</TitleBarDragRegion>);
    const region = screen.getByText('title');
    expect(region).toHaveAttribute('data-tauri-drag-region');
    await userEvent.dblClick(region);
    expect(win.toggleMaximize).toHaveBeenCalledTimes(1);
  });
});
