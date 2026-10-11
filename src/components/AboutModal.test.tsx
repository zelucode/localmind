import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutModal } from './AboutModal';
import pkg from '../../package.json';
import { RELEASES } from '../data/releases';

const currentRow = `v${pkg.version}`;

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

  it("lists the releases, with this version open and marked", () => {
    render(<AboutModal isOpen onClose={() => {}} />);
    expect(screen.getByText("What's New")).toBeInTheDocument();
    const current = screen.getByRole('button', { name: new RegExp(currentRow.replace(/\W/g, '.')) });
    expect(current).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('This version')).toBeInTheDocument();
    expect(screen.getByText(RELEASES[0].highlights[0])).toBeInTheDocument();
  });

  it('collapses and expands a release', async () => {
    render(<AboutModal isOpen onClose={() => {}} />);
    const row = screen.getByRole('button', { name: new RegExp(currentRow.replace(/\W/g, '.')) });
    await userEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(RELEASES[0].highlights[0])).not.toBeInTheDocument();
    await userEvent.click(row);
    expect(screen.getByText(RELEASES[0].highlights[0])).toBeInTheDocument();
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
