import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));

import { openExternal } from '../lib/tauri';
import { GlobalSearchModal } from './GlobalSearchModal';
import { INITIAL_AI_TOOLS } from '../data/defaultTools';
import { defaultThemePresets } from '../theme';
import { ToolBookmark } from '../types';

const bookmark: ToolBookmark = {
  id: 'excali',
  title: 'Excalidraw Whiteboard',
  url: 'https://excalidraw.com',
  description: 'Virtual whiteboard for sketching diagrams',
  category: 'design',
  isAi: false,
  freeTierBadge: 'No Sign-Up',
  tags: ['whiteboard'],
  createdAt: '2026-01-01',
  stars: 131300,
};

function setup() {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    tools: INITIAL_AI_TOOLS,
    bookmarks: [bookmark],
    activeView: 'home' as const,
    onNavigate: vi.fn(),
    onOpenKeyVault: vi.fn(),
    onOpenConfigExporter: vi.fn(),
    onOpenRateLimitMatrix: vi.fn(),
    onOpenAdvisor: vi.fn(),
    onOpenAddModal: vi.fn(),
    onOpenAddBookmarkModal: vi.fn(),
    onToggleLightDark: vi.fn(),
    onOpenShortcuts: vi.fn(),
    activeTheme: defaultThemePresets[0],
  };
  render(<GlobalSearchModal {...props} />);
  return props;
}

describe('GlobalSearchModal copy', () => {
  it('uses the real bookmark count in the tab label and the page subtitle', async () => {
    setup();
    expect(screen.getByRole('button', { name: 'Bookmarks (1)' })).toBeInTheDocument();
    await userEvent.type(document.getElementById('input-global-search')!, 'free online tool');
    expect(await screen.findByText(/^1 free web & developer utilities/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/270\+|frontier/i);
  });
});

describe('GlobalSearchModal', () => {
  it('finds a bookmark by its title (regression: results used a missing `name` field)', async () => {
    setup();
    await userEvent.type(document.getElementById('input-global-search')!, 'excalidraw');
    expect(await screen.findByText('Excalidraw Whiteboard')).toBeInTheDocument();
  });

  it('opens the selected bookmark through the external opener', async () => {
    const props = setup();
    await userEvent.type(document.getElementById('input-global-search')!, 'excalidraw');
    await userEvent.click(await screen.findByText('Excalidraw Whiteboard'));
    expect(openExternal).toHaveBeenCalledWith('https://excalidraw.com');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('navigates to the new AI Tools and Runtimes pages', async () => {
    const props = setup();
    await userEvent.type(document.getElementById('input-global-search')!, 'runtimes');
    await userEvent.click(await screen.findByText('Runtimes'));
    expect(props.onNavigate).toHaveBeenCalledWith('runtimes');
  });
});
