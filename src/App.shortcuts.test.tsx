import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./lib/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/backend')>()),
  probePorts: vi.fn().mockResolvedValue([]),
  verifyApiKey: vi.fn(),
  askAdvisor: vi.fn(),
}));

import App from './App';

const THEME_KEY = 'ai_nexus_theme_id_v1';

beforeEach(() => {
  localStorage.setItem('ai_nexus_show_loading_v1', 'false');
  localStorage.setItem('ai_nexus_show_startup_v1', 'false');
});

const title = () => screen.getByRole('heading', { level: 1 });

// Each shortcut listed in the cheat-sheet must do what the cheat-sheet says.
describe('keyboard shortcuts', () => {
  it('3, 4, 5 and 7 open Bookmarks, Runtimes, Configs and Settings', async () => {
    render(<App />);
    for (const [key, page] of [['3', 'Bookmarks'], ['4', 'Runtimes'], ['5', 'Configs & Limits'], ['7', 'Settings']] as const) {
      await userEvent.keyboard(key);
      expect(title()).toHaveTextContent(page);
    }
  });

  it('k opens the Key Vault', async () => {
    render(<App />);
    await userEvent.keyboard('k');
    expect(title()).toHaveTextContent('Key Vault');
  });

  it('c opens the Config Exporter and l opens the Rate-Limit Matrix', async () => {
    render(<App />);
    await userEvent.keyboard('l');
    expect(title()).toHaveTextContent('Configs & Limits');
    expect(screen.getByRole('tab', { name: /Rate-Limit/ })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('c');
    expect(screen.getByRole('tab', { name: /IDE & Agent Config Exporter/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('b opens the Add Bookmark form', async () => {
    render(<App />);
    await userEvent.keyboard('b');
    expect(screen.getByPlaceholderText('https://example.com/tool')).toBeInTheDocument();
  });

  it('t switches between a light and a dark theme', async () => {
    render(<App />);
    const before = localStorage.getItem(THEME_KEY);
    await userEvent.keyboard('t');
    const light = localStorage.getItem(THEME_KEY);
    expect(light).not.toBe(before);
    await userEvent.keyboard('t');
    expect(localStorage.getItem(THEME_KEY)).not.toBe(light);
  });

  it('Ctrl+K opens and closes the global search, even while typing in a field', async () => {
    render(<App />);
    await userEvent.keyboard('{Control>}k{/Control}');
    const box = screen.getByPlaceholderText(/Search pages, AI tools, bookmarks/);
    expect(box).toBeInTheDocument();
    box.focus();
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(screen.queryByPlaceholderText(/Search pages, AI tools, bookmarks/)).not.toBeInTheDocument();
  });

  it('/ focuses the search box of the current page', async () => {
    render(<App />);
    await userEvent.keyboard('2');
    await userEvent.keyboard('/');
    expect(document.activeElement).toBe(screen.getByPlaceholderText(/Filter tools by name/));
  });

  it('single-letter shortcuts are ignored while typing in a text field', async () => {
    render(<App />);
    await userEvent.keyboard('2');
    await userEvent.click(screen.getByPlaceholderText(/Filter tools by name/));
    await userEvent.keyboard('k6t');
    expect(title()).toHaveTextContent('AI Tools');
    expect(screen.getByPlaceholderText(/Filter tools by name/)).toHaveValue('k6t');
  });
});
