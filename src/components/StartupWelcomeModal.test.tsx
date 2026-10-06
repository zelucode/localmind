import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import pkg from '../../package.json';
import { StartupWelcomeModal } from './StartupWelcomeModal';

function setup(over: Partial<React.ComponentProps<typeof StartupWelcomeModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    showOnStartup: true,
    onToggleShowOnStartup: vi.fn(),
    onNavigate: vi.fn(),
    onOpenKeyVault: vi.fn(),
    onOpenGlobalSearch: vi.fn(),
    totalTools: 29,
    totalBookmarks: 312,
    ...over,
  };
  render(<StartupWelcomeModal {...props} />);
  return props;
}

describe('StartupWelcomeModal copy', () => {
  it('shows the real app version, not a made-up one', () => {
    setup();
    expect(screen.getByText(`v${pkg.version} Local-First`)).toBeInTheDocument();
    expect(screen.queryByText(/v2\.5/)).not.toBeInTheDocument();
  });

  it('shows the real counts it is given, without "+" or "frontier model" claims', () => {
    setup({ totalTools: 29, totalBookmarks: 312 });
    expect(screen.getByText('29 AI tools')).toBeInTheDocument();
    expect(screen.getByText('312 free online developer utilities')).toBeInTheDocument();
    expect(screen.getByText('312 Free Online Tool Bookmarks')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/frontier|270\+|zero-cost/i);
  });

  it('describes where data lives accurately', () => {
    setup();
    expect(document.body.textContent).toMatch(/Stored on this device/);
    expect(document.body.textContent).toMatch(/never uploaded/);
    expect(document.body.textContent).not.toMatch(/100% Private|browser sandbox|AES-GCM/i);
  });
});

describe('StartupWelcomeModal behavior', () => {
  it('opens the AI tools page and closes', async () => {
    const props = setup();
    await userEvent.click(document.getElementById('bento-ai-catalog')!);
    expect(props.onNavigate).toHaveBeenCalledWith('tools');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('Get Started, the close button, Escape and Enter all close it', async () => {
    const props = setup();
    const closes = () => vi.mocked(props.onClose).mock.calls.length;
    await userEvent.click(document.getElementById('btn-startup-get-started')!);
    expect(closes()).toBe(1);
    await userEvent.click(document.getElementById('btn-close-startup')!);
    expect(closes()).toBe(2);
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.keyboard('{Escape}');
    expect(closes()).toBe(3);
    await userEvent.keyboard('{Enter}');
    expect(closes()).toBe(4);
  });

  it('renders nothing when closed', () => {
    setup({ isOpen: false });
    expect(document.getElementById('btn-startup-get-started')).toBeNull();
  });

  it('can turn the startup screen off', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(props.onToggleShowOnStartup).toHaveBeenCalledWith(false);
  });
});
