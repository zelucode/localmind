import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../lib/tauri', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/tauri')>()),
  openExternal: vi.fn(),
}));

import { openExternal } from '../lib/tauri';
import { BookmarksPage } from './BookmarksPage';
import { DEFAULT_BOOKMARKS } from '../data/defaultBookmarks';
import { ToolBookmark } from '../types';

const rows = () => Array.from(document.querySelectorAll('[id^="card-bookmark-"]'));

function setup(bookmarks: ToolBookmark[] = DEFAULT_BOOKMARKS) {
  const props = {
    bookmarks,
    onAddBookmark: vi.fn(),
    onUpdateBookmark: vi.fn(),
    onDeleteBookmark: vi.fn(),
    onToggleFavorite: vi.fn(),
    onRecordClick: vi.fn(),
    onResetToDefaults: vi.fn(),
    onImportBookmarks: vi.fn(),
    onOpenAddModal: vi.fn(),
    onEditBookmark: vi.fn(),
    onOpenExportImportModal: vi.fn(),
  };
  render(<BookmarksPage {...props} />);
  return props;
}

const make = (over: Partial<ToolBookmark> & { id: string; title: string }): ToolBookmark => ({
  url: `https://${over.id}.example.com`,
  description: 'A tool',
  category: 'developer',
  isAi: false,
  freeTierBadge: 'Free',
  tags: [],
  createdAt: '2026-01-01',
  ...over,
});

describe('BookmarksPage list', () => {
  it('shows the first batch and offers to show more', async () => {
    setup();
    expect(rows()).toHaveLength(60);
    const more = screen.getByRole('button', { name: /Show 60 more/ });
    expect(more).toHaveTextContent(`(${DEFAULT_BOOKMARKS.length - 60} remaining)`);
    await userEvent.click(more);
    expect(rows()).toHaveLength(120);
  });

  it('filters by category with matching counts', async () => {
    setup();
    const dev = DEFAULT_BOOKMARKS.filter((b) => b.category === 'developer').length;
    await userEvent.click(screen.getByRole('button', { name: /^Developer & Code/ }));
    expect(screen.getByText(/Showing/)).toHaveTextContent(`${Math.min(dev, 60)} of ${dev}`);
  });

  it('searches titles, domains and tags', async () => {
    setup([
      make({ id: 'a', title: 'Regex Tester', tags: ['regex'] }),
      make({ id: 'b', title: 'JSON Formatter', url: 'https://jsonfmt.dev', tags: ['json'] }),
      make({ id: 'c', title: 'Diff Checker', tags: ['diff'] }),
    ]);
    const search = screen.getByPlaceholderText(/Search by name/);
    await userEvent.type(search, 'regex');
    expect(rows()).toHaveLength(1);
    await userEvent.clear(search);
    await userEvent.type(search, 'jsonfmt');
    expect(rows()).toHaveLength(1);
    await userEvent.clear(search);
    await userEvent.type(search, 'diff');
    expect(rows()).toHaveLength(1);
  });

  it('separates web utilities from AI utilities and favorites', async () => {
    setup([
      make({ id: 'a', title: 'Util', isAi: false }),
      make({ id: 'b', title: 'AI Helper', isAi: true }),
      make({ id: 'c', title: 'Starred', isFavorite: true }),
    ]);
    await userEvent.click(screen.getByRole('button', { name: /^Free AI utilities/ }));
    expect(rows()).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /^Favorites/ }));
    expect(rows()).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /^Web utilities/ }));
    expect(rows()).toHaveLength(2);
  });

  it('sorts by name', async () => {
    setup([make({ id: 'z', title: 'Zeta' }), make({ id: 'a', title: 'Alpha' }), make({ id: 'm', title: 'Mid' })]);
    await userEvent.selectOptions(screen.getByLabelText('Sort bookmarks'), 'name');
    expect(rows().map((r) => r.id)).toEqual(['card-bookmark-a', 'card-bookmark-m', 'card-bookmark-z']);
  });

  it('filters by tag when a tag is clicked and clears it', async () => {
    setup([
      make({ id: 'a', title: 'A', tags: ['pdf'] }),
      make({ id: 'b', title: 'B', tags: ['video'] }),
    ]);
    await userEvent.click(screen.getByRole('button', { name: '#pdf' }));
    expect(rows()).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Clear tag filter' }));
    expect(rows()).toHaveLength(2);
  });

  it('shows an empty state and resets filters', async () => {
    setup([make({ id: 'a', title: 'A' })]);
    await userEvent.type(screen.getByPlaceholderText(/Search by name/), 'nothing-matches');
    expect(screen.getByText('No bookmarks found')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    expect(rows()).toHaveLength(1);
  });
});

describe('BookmarksPage actions', () => {
  it('opens a tool externally and records the click', async () => {
    const props = setup([make({ id: 'a', title: 'A' })]);
    await userEvent.click(screen.getByRole('button', { name: /^Open/ }));
    expect(props.onRecordClick).toHaveBeenCalledWith('a');
    expect(openExternal).toHaveBeenCalledWith('https://a.example.com');
  });

  it('toggles favorite and starts editing', async () => {
    const props = setup([make({ id: 'a', title: 'A' })]);
    await userEvent.click(screen.getByRole('button', { name: 'Favorite A' }));
    expect(props.onToggleFavorite).toHaveBeenCalledWith('a');
    await userEvent.click(screen.getByRole('button', { name: 'Edit A' }));
    expect(props.onEditBookmark).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });

  it('only offers delete for custom bookmarks, after confirmation', async () => {
    const props = setup([make({ id: 'a', title: 'A' }), make({ id: 'b', title: 'B', isCustom: true })]);
    expect(screen.queryByRole('button', { name: 'Delete A' })).not.toBeInTheDocument();

    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    await userEvent.click(screen.getByRole('button', { name: 'Delete B' }));
    expect(props.onDeleteBookmark).not.toHaveBeenCalled();

    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    await userEvent.click(screen.getByRole('button', { name: 'Delete B' }));
    expect(props.onDeleteBookmark).toHaveBeenCalledWith('b');
  });

  it('Manage menu: export/import opens the center, restore defaults asks first', async () => {
    const props = setup([make({ id: 'a', title: 'A' })]);
    await userEvent.click(screen.getByRole('button', { name: /Manage/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Export & Import/ }));
    expect(props.onOpenExportImportModal).toHaveBeenCalled();

    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    await userEvent.click(screen.getByRole('button', { name: /Manage/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Restore defaults/ }));
    expect(props.onResetToDefaults).not.toHaveBeenCalled();

    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    await userEvent.click(screen.getByRole('button', { name: /Manage/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Restore defaults/ }));
    expect(props.onResetToDefaults).toHaveBeenCalled();
  });
});

describe('BookmarksPage views', () => {
  it('switches to grid and remembers it', async () => {
    setup([make({ id: 'a', title: 'A' })]);
    await userEvent.click(screen.getByRole('button', { name: 'Grid view' }));
    expect(document.querySelector('table')).toBeNull();
    expect(rows()).toHaveLength(1);
    expect(localStorage.getItem('localmind_bookmarks_view_v1')).toBe('grid');
  });

  it('renders a stable letter avatar per bookmark', () => {
    setup([make({ id: 'a', title: 'Alpha' })]);
    expect(rows()[0]).toHaveTextContent('A');
  });
});
