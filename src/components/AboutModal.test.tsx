import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutModal } from './AboutModal';
import pkg from '../../package.json';

describe('AboutModal', () => {
  it('renders nothing when closed', () => {
    render(<AboutModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the real app version from package.json', () => {
    render(<AboutModal isOpen onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'About LocalMind' })).toBeInTheDocument();
    expect(screen.getByText(pkg.version)).toBeInTheDocument();
  });

  it('describes privacy without claiming more than it does', () => {
    render(<AboutModal isOpen onClose={() => {}} />);
    expect(screen.getByText(/no account and no usage tracking/)).toBeInTheDocument();
    expect(screen.queryByText(/100% private|zero-cost|verified/i)).not.toBeInTheDocument();
  });

  it('closes from the X and from the backdrop, not from a click inside', async () => {
    const onClose = vi.fn();
    render(<AboutModal isOpen onClose={onClose} />);
    await userEvent.click(screen.getByText('Privacy'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(document.getElementById('modal-about')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
