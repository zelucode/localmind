import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/backend')>()),
  probePorts: vi.fn().mockResolvedValue([]),
  verifyApiKey: vi.fn(),
  askAdvisor: vi.fn(),
}));

import App from './App';

beforeEach(() => {
  // Skip the boot animation and the welcome dialog so tests start on a clean shell.
  localStorage.setItem('ai_nexus_show_loading_v1', 'false');
  localStorage.setItem('ai_nexus_show_startup_v1', 'false');
});

const nav = (label: string) => within(document.getElementById('app-left-sidebar')!).getByRole('button', { name: label });
const title = () => screen.getByRole('heading', { level: 1 });

describe('App shell navigation', () => {
  it('starts on Home', () => {
    render(<App />);
    expect(title()).toHaveTextContent('Home');
    expect(screen.getByText(/Ask any free AI/)).toBeInTheDocument();
  });

  it.each([
    ['AI Tools', /Filter tools by name/, 'placeholder'],
    ['Bookmarks', /Free Online Tool Bookmarks/, 'text'],
    ['Runtimes', /OmniRoute & Local AI Daemon Monitor/, 'text'],
    ['Configs & Limits', /IDE & Coding Agent Config Exporter/, 'text'],
    ['Key Vault', /API Key Vault & Free Credit Tracker/, 'text'],
    ['Settings', /Settings/, 'heading'],
  ] as const)('opens %s from the sidebar', async (label, marker, kind) => {
    render(<App />);
    await userEvent.click(nav(label));
    expect(title()).toHaveTextContent(label);
    if (kind === 'placeholder') expect(screen.getByPlaceholderText(marker)).toBeInTheDocument();
    else expect(screen.getAllByText(marker).length).toBeGreaterThan(0);
  });

  it('switches the Configs page between its two tabs', async () => {
    render(<App />);
    await userEvent.click(nav('Configs & Limits'));
    await userEvent.click(screen.getByRole('tab', { name: /Rate-Limit/ }));
    expect(screen.getByText(/Rate-Limit & Rotation Strategy Matrix/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /IDE & Agent Config Exporter/ }));
    expect(screen.getByText(/IDE & Coding Agent Config Exporter/)).toBeInTheDocument();
  });

  it('number keys jump between pages', async () => {
    render(<App />);
    await userEvent.keyboard('2');
    expect(title()).toHaveTextContent('AI Tools');
    await userEvent.keyboard('7');
    expect(title()).toHaveTextContent('Key Vault');
    await userEvent.keyboard('1');
    expect(title()).toHaveTextContent('Home');
  });

  it('"?" opens the shortcuts dialog from the keyboard and from the Help menu', async () => {
    render(<App />);
    await userEvent.keyboard('?');
    expect(document.getElementById('modal-keyboard-shortcuts')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(document.getElementById('modal-keyboard-shortcuts')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Help' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Keyboard Shortcuts/ }));
    expect(document.getElementById('modal-keyboard-shortcuts')).toBeInTheDocument();
  });

  it('opens Report a Problem from the Help menu and closes it with Escape', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Help' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Report a Problem/ }));
    expect(screen.getByRole('dialog', { name: 'Report a Problem' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Report a Problem' })).not.toBeInTheDocument();
  });

  it('opens About from the Help menu', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Help' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /About LocalMind/ }));
    expect(screen.getByRole('dialog', { name: 'About LocalMind' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'About LocalMind' })).not.toBeInTheDocument();
  });

  it('remembers the collapsed sidebar', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(localStorage.getItem('localmind_sidebar_collapsed_v1')).toBe('true');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });

  it('toggles between light and dark themes', async () => {
    render(<App />);
    const before = localStorage.getItem('ai_nexus_theme_id_v1');
    await userEvent.click(screen.getByRole('button', { name: 'Toggle light and dark mode' }));
    expect(localStorage.getItem('ai_nexus_theme_id_v1')).not.toBe(before);
  });

  it('saves the splash theme for the next launch when the theme is applied', () => {
    render(<App />);
    const saved = JSON.parse(localStorage.getItem('localmind_boot_theme_v1') || 'null');
    expect(saved).toMatchObject({ bg: expect.any(String), text: expect.any(String), primary: expect.any(String) });
  });
});

describe('Advisor is hidden while its feature flag is off', () => {
  it('has no floating button, Omnibar button or shortcut, and "a" does nothing', async () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: /Ask Advisor/ })).not.toBeInTheDocument();
    expect(document.getElementById('btn-omnibar-advisor')).not.toBeInTheDocument();
    await userEvent.keyboard('a');
    expect(document.getElementById('modal-ai-advisor')).not.toBeInTheDocument();
    await userEvent.keyboard('?');
    expect(screen.queryByText(/Architecture Advisor/)).not.toBeInTheDocument();
  });
});

describe('App key flow', () => {
  it('stores a key added in the vault and reflects it on Home', async () => {
    render(<App />);
    await userEvent.click(nav('Key Vault'));
    await userEvent.type(screen.getByPlaceholderText('Paste your API key here...'), 'AIzaSyTestKey1234567890');
    await userEvent.click(screen.getByRole('button', { name: /Save/i }));

    await userEvent.click(nav('Home'));
    expect(screen.getByText('1 key')).toBeInTheDocument();
    expect(screen.getByText('1 not verified')).toBeInTheDocument();
  });
});
