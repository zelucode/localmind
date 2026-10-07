import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './Sidebar';
import { ActiveView } from '../types';

function setup(activeView: ActiveView = 'home', collapsed = false) {
  const props = {
    activeView,
    onNavigate: vi.fn(),
    collapsed,
    onToggleCollapsed: vi.fn(),
    totalTools: 25,
    totalBookmarks: 270,
    totalKeys: 3,
  };
  render(<Sidebar {...props} />);
  const desktop = within(document.getElementById('app-left-sidebar')!);
  return { props, desktop };
}

describe('Sidebar', () => {
  it('groups pages under Discover, Developer and Secure', () => {
    const { desktop } = setup();
    for (const group of ['Discover', 'Developer', 'Secure']) {
      expect(desktop.getByText(group)).toBeInTheDocument();
    }
    for (const label of ['Home', 'AI Tools', 'Bookmarks', 'Runtimes', 'Configs & Limits', 'Setup', 'Key Vault', 'Settings']) {
      expect(desktop.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('shows live counts', () => {
    const { desktop } = setup();
    expect(desktop.getByRole('button', { name: 'AI Tools' })).toHaveTextContent('25');
    expect(desktop.getByRole('button', { name: 'Bookmarks' })).toHaveTextContent('270');
    expect(desktop.getByRole('button', { name: 'Key Vault' })).toHaveTextContent('3');
  });

  it('marks only the active page as current', () => {
    const { desktop } = setup('bookmarks');
    expect(desktop.getByRole('button', { name: 'Bookmarks' })).toHaveAttribute('aria-current', 'page');
    expect(desktop.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it.each([
    ['Home', 'home'],
    ['AI Tools', 'tools'],
    ['Bookmarks', 'bookmarks'],
    ['Runtimes', 'runtimes'],
    ['Configs & Limits', 'configs'],
    ['Setup', 'setup'],
    ['Key Vault', 'vault'],
    ['Settings', 'settings'],
  ] as const)('"%s" navigates to %s', async (label, view) => {
    const { props, desktop } = setup();
    await userEvent.click(desktop.getByRole('button', { name: label }));
    expect(props.onNavigate).toHaveBeenCalledWith(view);
  });

  it('hides labels and group titles when collapsed but keeps accessible names', () => {
    const { desktop } = setup('home', true);
    expect(desktop.queryByText('Discover')).not.toBeInTheDocument();
    expect(desktop.queryByText('270')).not.toBeInTheDocument();
    expect(desktop.getByRole('button', { name: 'Bookmarks' })).toBeInTheDocument();
    expect(desktop.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });

  it('toggles collapse', async () => {
    const { props, desktop } = setup();
    await userEvent.click(desktop.getByRole('button', { name: 'Collapse sidebar' }));
    expect(props.onToggleCollapsed).toHaveBeenCalled();
  });

  it('has a mobile bottom bar with the main pages', () => {
    setup();
    const mobile = within(document.getElementById('app-mobile-nav')!);
    expect(mobile.getAllByRole('button')).toHaveLength(6);
  });
});
