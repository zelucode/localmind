import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

describe('KeyboardShortcutsModal', () => {
  it('renders nothing when closed', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('lists the shortcuts in three groups, with the keys', () => {
    render(<KeyboardShortcutsModal isOpen onClose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeInTheDocument();
    for (const group of ['Navigation & View Switching', 'Utilities', 'System & Global Hotkeys']) {
      expect(screen.getByRole('heading', { name: group })).toBeInTheDocument();
    }
    expect(screen.getByText('Go to Home').parentElement!.querySelector('kbd')).toHaveTextContent('1');
    expect(screen.getByText('⌘K / Ctrl+K')).toBeInTheDocument();
  });

  it('does not advertise the Advisor shortcut while the Advisor is hidden', () => {
    render(<KeyboardShortcutsModal isOpen onClose={() => {}} />);
    expect(screen.queryByText(/Architecture Advisor/)).not.toBeInTheDocument();
  });

  it('closes from the X button, the footer button and the backdrop, but not from a click inside', async () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen onClose={onClose} />);
    await userEvent.click(screen.getByText(/Power-user hotkeys/));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(document.getElementById('btn-close-shortcuts-modal')!);
    await userEvent.click(screen.getByRole('button', { name: /Got it/ }));
    await userEvent.click(document.getElementById('modal-keyboard-shortcuts')!);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
