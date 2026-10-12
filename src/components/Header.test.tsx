import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { DOCS_URL } from '../config/links';
import { openExternal } from '../lib/tauri';
import { ActiveView } from '../types';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));

function setup(activeView: ActiveView = 'home', overrides: Partial<React.ComponentProps<typeof Header>> = {}) {
  const props = {
    activeView,
    onNavigate: vi.fn(),
    sidebarCollapsed: false,
    themeMode: 'dark' as const,
    onToggleTheme: vi.fn(),
    onOpenAddModal: vi.fn(),
    onOpenAddBookmarkModal: vi.fn(),
    onOpenGlobalSearch: vi.fn(),
    onOpenShortcuts: vi.fn(),
    onOpenWelcome: vi.fn(),
    onOpenAbout: vi.fn(),
    onOpenReportProblem: vi.fn(),
    ...overrides,
  };
  render(<Header {...props} />);
  return props;
}

describe('Header page title and primary action', () => {
  it.each([
    ['home', 'Home'],
    ['tools', 'AI Tools'],
    ['bookmarks', 'Bookmarks'],
    ['runtimes', 'Runtimes'],
    ['configs', 'Configs & Limits'],
    ['vault', 'Key Vault'],
    ['settings', 'Settings'],
  ] as const)('shows "%s" page as "%s"', (view, title) => {
    setup(view);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
  });

  it.each(['home', 'tools'] as const)('offers Add Tool on %s', async (view) => {
    const props = setup(view);
    await userEvent.click(screen.getByRole('button', { name: /Add Tool/ }));
    expect(props.onOpenAddModal).toHaveBeenCalledTimes(1);
  });

  it.each(['runtimes', 'configs', 'vault', 'settings'] as const)('has no Add Tool button on %s', (view) => {
    setup(view);
    expect(screen.queryByRole('button', { name: /Add Tool/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bookmark Tool/ })).not.toBeInTheDocument();
  });

  it('offers Bookmark Tool on the Bookmarks page', async () => {
    const props = setup('bookmarks');
    await userEvent.click(screen.getByRole('button', { name: /Bookmark Tool/ }));
    expect(props.onOpenAddBookmarkModal).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /^Add Tool/ })).not.toBeInTheDocument();
  });
});

describe('Header controls', () => {
  it('goes Home from the brand button', async () => {
    const props = setup('settings');
    await userEvent.click(document.getElementById('header-btn-brand')!);
    expect(props.onNavigate).toHaveBeenCalledWith('home');
  });

  it('opens global search from the search box', async () => {
    const props = setup();
    await userEvent.click(document.getElementById('header-btn-global-search')!);
    expect(props.onOpenGlobalSearch).toHaveBeenCalled();
  });

  it('toggles the theme', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Toggle light and dark mode' }));
    expect(props.onToggleTheme).toHaveBeenCalled();
  });

  it('shows the wordmark text only while the sidebar is expanded', () => {
    setup('home', { sidebarCollapsed: true });
    expect(screen.queryByText('LocalMind')).not.toBeInTheDocument();
  });
});

describe('Help menu', () => {
  const open = async () => userEvent.click(screen.getByRole('button', { name: 'Help' }));

  it('lists the available items', async () => {
    setup();
    await open();
    expect(screen.getByRole('menuitem', { name: /Keyboard Shortcuts/ })).toBeEnabled();
    expect(screen.getByRole('menuitem', { name: /Welcome & Quick Start/ })).toBeEnabled();
    expect(screen.getByRole('menuitem', { name: /About LocalMind/ })).toBeEnabled();
    expect(screen.getByRole('menuitem', { name: /Documentation/ })).toBeEnabled();
    expect(screen.getByRole('menuitem', { name: /Report a Problem/ })).toBeEnabled();
  });

  it('"Documentation" opens the docs site in the browser and closes the menu', async () => {
    setup();
    await open();
    await userEvent.click(screen.getByRole('menuitem', { name: /Documentation/ }));
    expect(openExternal).toHaveBeenCalledWith(DOCS_URL);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it.each([
    ['Keyboard Shortcuts', 'onOpenShortcuts'],
    ['Welcome & Quick Start', 'onOpenWelcome'],
    ['About LocalMind', 'onOpenAbout'],
    ['Report a Problem', 'onOpenReportProblem'],
  ] as const)('"%s" runs its handler and closes the menu', async (label, handler) => {
    const props = setup();
    await open();
    await userEvent.click(screen.getByRole('menuitem', { name: new RegExp(label) }));
    expect(props[handler]).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape and on an outside click', async () => {
    setup();
    await open();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await open();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
