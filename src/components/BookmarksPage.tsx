import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Search,
  ExternalLink,
  Copy,
  Check,
  Star,
  Sparkles,
  Wrench,
  Tag,
  Download,
  RotateCcw,
  FileText,
  FolderInput,
  Trash2,
  Pencil,
  Github,
  X,
  List,
  LayoutGrid,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { ToolBookmark, BookmarkCategory } from '../types';
import { ExportMarkdownModal } from './ExportMarkdownModal';
import { FORMAT_INFO, exportBookmarks, exportFilename } from '../lib/bookmarkTransfer';
import { downloadTextFile } from '../lib/files';
import { openExternal } from '../lib/tauri';

interface BookmarksPageProps {
  bookmarks: ToolBookmark[];
  onAddBookmark: (bookmark: ToolBookmark) => void;
  onUpdateBookmark: (bookmark: ToolBookmark) => void;
  onDeleteBookmark: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRecordClick: (id: string) => void;
  onResetToDefaults: () => void;
  onImportBookmarks: (imported: ToolBookmark[]) => void;
  onOpenAddModal: () => void;
  onEditBookmark: (bookmark: ToolBookmark) => void;
  onOpenExportImportModal?: () => void;
}

type TypeFilter = 'all' | 'ai' | 'non-ai' | 'favorites';
type SortKey = 'stars' | 'clicks' | 'name' | 'recent';
type ViewMode = 'list' | 'grid';

const CATEGORY_TABS: { id: BookmarkCategory; label: string }[] = [
  { id: 'all', label: 'All Tools' },
  { id: 'developer', label: 'Developer & Code' },
  { id: 'design', label: 'Design & Graphics' },
  { id: 'converters', label: 'Data & Converters' },
  { id: 'ai-utilities', label: 'AI Web Utilities' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'utilities', label: 'General Utilities' },
  { id: 'security', label: 'Privacy & Security' },
  { id: 'education', label: 'Learning' },
  { id: 'media', label: 'Media' },
];

const PAGE_STEP = 60;
const STORAGE_VIEW_KEY = 'localmind_bookmarks_view_v1';
const STORAGE_SORT_KEY = 'localmind_bookmarks_sort_v1';

function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v as T) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function savePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignored
  }
}

const getDomainFromUrl = (urlStr: string) => {
  try {
    return new URL(urlStr).hostname.replace('www.', '');
  } catch {
    return urlStr;
  }
};

const formatStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

/** Letter avatar with a stable hue per domain. Real favicons are tracked in the backlog (they need local caching to stay private). */
const Avatar: React.FC<{ title: string; url: string; size?: number }> = ({ title, url, size = 32 }) => {
  const domain = getDomainFromUrl(url);
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = (hash * 31 + domain.charCodeAt(i)) % 360;
  return (
    <span
      aria-hidden="true"
      className="rounded-lg grid place-items-center font-bold shrink-0 text-xs"
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${hash} 55% 50% / 0.16)`,
        color: `hsl(${hash} 60% 55%)`,
        border: `1px solid hsl(${hash} 55% 50% / 0.3)`,
      }}
    >
      {title.charAt(0).toUpperCase()}
    </span>
  );
};

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  bookmarks,
  onDeleteBookmark,
  onToggleFavorite,
  onRecordClick,
  onResetToDefaults,
  onOpenAddModal,
  onEditBookmark,
  onOpenExportImportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookmarkCategory>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [sortBy, setSortByState] = useState<SortKey>(() =>
    readPref(STORAGE_SORT_KEY, ['stars', 'clicks', 'name', 'recent'] as const, 'stars')
  );
  const [view, setViewState] = useState<ViewMode>(() => readPref(STORAGE_VIEW_KEY, ['list', 'grid'] as const, 'list'));
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportMarkdownOpen, setIsExportMarkdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const setSortBy = (s: SortKey) => {
    setSortByState(s);
    savePref(STORAGE_SORT_KEY, s);
  };
  const setView = (v: ViewMode) => {
    setViewState(v);
    savePref(STORAGE_VIEW_KEY, v);
  };

  // Back to the first batch whenever the result set changes
  useEffect(() => {
    setVisibleCount(PAGE_STEP);
  }, [searchQuery, selectedCategory, typeFilter, activeTagFilter, sortBy]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const filteredBookmarks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = bookmarks.filter((bm) => {
      if (typeFilter === 'ai' && !bm.isAi) return false;
      if (typeFilter === 'non-ai' && bm.isAi) return false;
      if (typeFilter === 'favorites' && !bm.isFavorite) return false;
      if (selectedCategory !== 'all' && bm.category !== selectedCategory) return false;
      if (activeTagFilter && !bm.tags.includes(activeTagFilter)) return false;
      if (q) {
        const hit =
          bm.title.toLowerCase().includes(q) ||
          bm.description.toLowerCase().includes(q) ||
          bm.url.toLowerCase().includes(q) ||
          (bm.notes || '').toLowerCase().includes(q) ||
          bm.tags.some((t) => t.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'stars') {
        const d = (b.stars || 0) - (a.stars || 0);
        return d !== 0 ? d : a.title.localeCompare(b.title);
      }
      if (sortBy === 'clicks') {
        const d = (b.clickCount || 0) - (a.clickCount || 0);
        return d !== 0 ? d : a.title.localeCompare(b.title);
      }
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return result;
  }, [bookmarks, typeFilter, selectedCategory, activeTagFilter, searchQuery, sortBy]);

  const shown = filteredBookmarks.slice(0, visibleCount);
  const remaining = filteredBookmarks.length - shown.length;

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = { all: bookmarks.length };
    for (const b of bookmarks) c[b.category] = (c[b.category] || 0) + 1;
    return c;
  }, [bookmarks]);

  const totalCount = bookmarks.length;
  const aiCount = bookmarks.filter((b) => b.isAi).length;
  const favoritesCount = bookmarks.filter((b) => b.isFavorite).length;

  const activeCategoryLabel = CATEGORY_TABS.find((c) => c.id === selectedCategory)?.label || 'All Tools';
  const anyFilter = searchQuery !== '' || activeTagFilter !== null || typeFilter !== 'all' || selectedCategory !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTagFilter(null);
    setTypeFilter('all');
    setSelectedCategory('all');
  };

  const handleCopy = (bookmark: ToolBookmark) => {
    navigator.clipboard.writeText(bookmark.url);
    setCopiedId(bookmark.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleOpenTool = (bookmark: ToolBookmark) => {
    onRecordClick(bookmark.id);
    void openExternal(bookmark.url);
  };

  const handleExportJson = () => {
    downloadTextFile(exportFilename('json', 'all'), exportBookmarks(bookmarks, 'json'), FORMAT_INFO.json.mime);
  };

  const handleDelete = (bm: ToolBookmark) => {
    if (window.confirm(`Delete bookmark "${bm.title}"?`)) onDeleteBookmark(bm.id);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Reset bookmarks back to the curated default tools list? Any custom additions will be replaced.')) {
      onResetToDefaults();
    }
  };

  const typeOptions: { id: TypeFilter; label: string; icon: LucideIcon; count: number }[] = [
    { id: 'all', label: 'All', icon: Bookmark, count: totalCount },
    { id: 'non-ai', label: 'Web utilities', icon: Wrench, count: totalCount - aiCount },
    { id: 'ai', label: 'Free AI utilities', icon: Sparkles, count: aiCount },
    { id: 'favorites', label: 'Favorites', icon: Star, count: favoritesCount },
  ];

  const railStyle = (active: boolean): React.CSSProperties =>
    active
      ? { backgroundColor: 'var(--theme-raised)', color: 'var(--theme-text)', fontWeight: 600 }
      : { color: 'var(--theme-text-secondary)' };

  const iconBtn = 'p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-85';
  const iconBtnStyle: React.CSSProperties = {
    backgroundColor: 'var(--theme-raised)',
    borderColor: 'var(--theme-border)',
    color: 'var(--theme-text-secondary)',
  };

  const actions = (bm: ToolBookmark) => (
    <div className="flex items-center justify-end gap-1.5">
      <button onClick={() => onEditBookmark(bm)} title="Edit this bookmark" aria-label={`Edit ${bm.title}`} className={iconBtn} style={iconBtnStyle}>
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => handleCopy(bm)}
        title="Copy URL"
        aria-label={`Copy URL for ${bm.title}`}
        className={iconBtn}
        style={{ ...iconBtnStyle, color: copiedId === bm.id ? '#10b981' : iconBtnStyle.color }}
      >
        {copiedId === bm.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      {bm.githubUrl && (
        <a
          href={bm.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View repository on GitHub"
          aria-label={`${bm.title} on GitHub`}
          className={iconBtn}
          style={iconBtnStyle}
        >
          <Github className="w-3.5 h-3.5" />
        </a>
      )}
      {bm.isCustom && (
        <button
          onClick={() => handleDelete(bm)}
          title="Delete custom bookmark"
          aria-label={`Delete ${bm.title}`}
          className={`${iconBtn} text-rose-400`}
          style={{ ...iconBtnStyle, color: undefined }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={() => handleOpenTool(bm)}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95 whitespace-nowrap"
        style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000000)' }}
      >
        Open <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const star = (bm: ToolBookmark) => (
    <button
      onClick={() => onToggleFavorite(bm.id)}
      title={bm.isFavorite ? 'Remove from favorites' : 'Star as favorite'}
      aria-label={bm.isFavorite ? `Unfavorite ${bm.title}` : `Favorite ${bm.title}`}
      aria-pressed={!!bm.isFavorite}
      className="p-1 rounded-md cursor-pointer active:scale-90 transition-transform"
    >
      <Star className={`w-4 h-4 ${bm.isFavorite ? 'fill-amber-400 text-amber-400' : 'opacity-40'}`} />
    </button>
  );

  const tagButtons = (bm: ToolBookmark, max: number) =>
    bm.tags.slice(0, max).map((tag) => (
      <button
        key={tag}
        onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
        className="px-1.5 py-0.5 text-[10px] rounded border cursor-pointer whitespace-nowrap"
        style={{
          backgroundColor: activeTagFilter === tag ? 'var(--theme-primary)' : 'var(--theme-raised)',
          borderColor: 'var(--theme-border)',
          color: activeTagFilter === tag ? 'var(--theme-primary-foreground, #000000)' : 'var(--theme-text-secondary)',
        }}
      >
        #{tag}
      </button>
    ));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Free Online Tool Bookmarks</h2>
          <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
            {totalCount} free web tools, from developer utilities to AI helpers. Click any one to jump straight to work.
          </p>
        </div>

        <div ref={menuRef} className="relative">
          <button
            id="btn-bookmarks-manage"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer hover:opacity-85"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            Manage
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-56 p-1 rounded-xl border shadow-xl z-30"
              style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
            >
              {[
                { id: 'btn-open-export-import-header', icon: FolderInput, label: 'Export & Import', run: () => onOpenExportImportModal?.(), hidden: !onOpenExportImportModal },
                { id: 'btn-export-markdown-header', icon: FileText, label: 'Export Markdown', run: () => setIsExportMarkdownOpen(true) },
                { id: 'btn-quick-json', icon: Download, label: 'Quick JSON backup', run: handleExportJson },
                { id: 'btn-restore-defaults', icon: RotateCcw, label: 'Restore defaults', run: handleRestoreDefaults },
              ]
                .filter((i) => !i.hidden)
                .map(({ id, icon: Icon, label, run }) => (
                  <button
                    key={id}
                    id={id}
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      run();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-md cursor-pointer hover:bg-[var(--theme-raised)]"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    <Icon className="w-3.5 h-3.5 opacity-70" />
                    {label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[11rem_minmax(0,1fr)] gap-5 items-start">
        {/* Filter rail */}
        <aside className="flex flex-col gap-0.5 lg:sticky lg:top-0" aria-label="Bookmark filters">
          <h6 className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Category
          </h6>
          {CATEGORY_TABS.filter((c) => c.id === 'all' || (categoryCounts[c.id] || 0) > 0).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer hover:bg-[var(--theme-raised)]"
              style={railStyle(selectedCategory === cat.id)}
            >
              <span className="flex-1 truncate">{cat.label}</span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                {categoryCounts[cat.id] || 0}
              </span>
            </button>
          ))}

          <h6 className="px-2.5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
            Show
          </h6>
          {typeOptions.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              aria-pressed={typeFilter === id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer hover:bg-[var(--theme-raised)]"
              style={railStyle(typeFilter === id)}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${id === 'favorites' ? 'text-amber-400' : ''}`} />
              <span className="flex-1 truncate">{label}</span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                {count}
              </span>
            </button>
          ))}
          {anyFilter && (
            <button onClick={resetFilters} className="mt-2 px-2.5 py-1 text-xs text-left underline cursor-pointer" style={{ color: 'var(--theme-primary)' }}>
              Reset all
            </button>
          )}
        </aside>

        <div className="min-w-0 space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
              <input
                id="input-search-bookmarks"
                type="text"
                placeholder="Search by name, utility (regex, json, svg), tag, or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: 'var(--theme-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              id="select-bookmarks-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort bookmarks"
              className="py-1.5 pl-2.5 pr-2 rounded-lg text-xs cursor-pointer focus:outline-none"
              style={{ backgroundColor: 'var(--theme-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
            >
              <option value="stars">Sort: Top GitHub stars</option>
              <option value="clicks">Sort: Most used</option>
              <option value="name">Sort: Name (A–Z)</option>
              <option value="recent">Sort: Recently added</option>
            </select>

            <div
              className="inline-flex rounded-lg overflow-hidden border"
              style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-card)' }}
              role="group"
              aria-label="View mode"
            >
              {([
                ['list', List, 'List view'],
                ['grid', LayoutGrid, 'Grid view'],
              ] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  id={`btn-bookmarks-view-${mode}`}
                  onClick={() => setView(mode)}
                  aria-pressed={view === mode}
                  title={label}
                  aria-label={label}
                  className="px-2.5 py-1.5 cursor-pointer"
                  style={{
                    backgroundColor: view === mode ? 'var(--theme-raised)' : 'transparent',
                    color: view === mode ? 'var(--theme-text)' : 'var(--theme-text-muted)',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            <span>
              Showing <strong style={{ color: 'var(--theme-text)' }}>{shown.length}</strong> of{' '}
              <strong style={{ color: 'var(--theme-text)' }}>{filteredBookmarks.length}</strong>
              {selectedCategory !== 'all' && <> in {activeCategoryLabel}</>}
            </span>
            {activeTagFilter && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border"
                style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-primary)' }}
              >
                <Tag className="w-3 h-3" />#{activeTagFilter}
                <button onClick={() => setActiveTagFilter(null)} aria-label="Clear tag filter" className="ml-1 opacity-60 hover:opacity-100 cursor-pointer">
                  ×
                </button>
              </span>
            )}
          </div>

          {filteredBookmarks.length === 0 ? (
            <div
              className="rounded-2xl border p-12 text-center space-y-4"
              style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
            >
              <div className="space-y-1">
                <h3 className="font-bold text-base">No bookmarks found</h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                  {anyFilter ? 'No online tools match your active filter criteria.' : 'Your bookmark list is currently empty.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {anyFilter && (
                  <button
                    onClick={resetFilters}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer hover:opacity-85"
                    style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000000)' }}
                >
                  Add New Bookmark
                </button>
              </div>
            </div>
          ) : view === 'list' ? (
            <div
              id="bookmarks-grid-section"
              className="rounded-xl border overflow-x-auto"
              style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
            >
              <table className="w-full text-xs min-w-[760px]">
                <thead>
                  <tr>
                    {['', 'Name', 'Tags', 'Type', 'Stars', ''].map((h, i) => (
                      <th
                        key={i}
                        className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wider border-b"
                        style={{ color: 'var(--theme-text-muted)', borderColor: 'var(--theme-border)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((bm) => (
                    <tr
                      key={bm.id}
                      id={`card-bookmark-${bm.id}`}
                      className="border-b last:border-b-0 hover:bg-[var(--theme-raised)]/50 transition-colors"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <td className="pl-3 pr-0 py-2 align-middle w-8">{star(bm)}</td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar title={bm.title} url={bm.url} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold truncate" title={bm.description}>
                              {bm.title}
                            </div>
                            <div className="text-[11px] font-mono truncate" style={{ color: 'var(--theme-text-muted)' }}>
                              {getDomainFromUrl(bm.url)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-wrap gap-1 max-w-[16rem]">{tagButtons(bm, 2)}</div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span
                          className="px-2 py-0.5 text-[10px] font-medium rounded-md border whitespace-nowrap"
                          style={{
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            color: bm.isAi ? '#38bdf8' : '#10b981',
                          }}
                        >
                          {bm.freeTierBadge}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle font-mono text-[11px]" style={{ color: 'var(--theme-text-secondary)' }}>
                        {bm.stars ? formatStars(bm.stars) : ''}
                      </td>
                      <td className="px-3 py-2 align-middle">{actions(bm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div id="bookmarks-grid-section" className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {shown.map((bm) => (
                <div
                  key={bm.id}
                  id={`card-bookmark-${bm.id}`}
                  className="rounded-xl border p-4 flex flex-col gap-3 min-w-0"
                  style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar title={bm.title} url={bm.url} size={36} />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate">{bm.title}</h3>
                        <span className="text-[11px] font-mono truncate block" style={{ color: 'var(--theme-text-muted)' }}>
                          {getDomainFromUrl(bm.url)}
                        </span>
                      </div>
                    </div>
                    {star(bm)}
                  </div>
                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                    {bm.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span
                      className="px-2 py-0.5 text-[10px] font-medium rounded-md border"
                      style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: bm.isAi ? '#38bdf8' : '#10b981' }}
                    >
                      {bm.freeTierBadge}
                    </span>
                    {tagButtons(bm, 3)}
                  </div>
                  <div className="mt-auto pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--theme-border)' }}>
                    {bm.stars ? (
                      <span className="font-mono text-[11px] flex items-center gap-1" style={{ color: 'var(--theme-text-secondary)' }}>
                        <Star className="w-3 h-3" />
                        {formatStars(bm.stars)}
                      </span>
                    ) : (
                      <span />
                    )}
                    {actions(bm)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {remaining > 0 && (
            <div className="flex justify-center pt-1">
              <button
                id="btn-bookmarks-show-more"
                onClick={() => setVisibleCount((n) => n + PAGE_STEP)}
                className="px-4 py-2 text-xs font-medium rounded-lg border cursor-pointer hover:opacity-85"
                style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-primary)' }}
              >
                Show {Math.min(PAGE_STEP, remaining)} more ({remaining} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      <ExportMarkdownModal
        isOpen={isExportMarkdownOpen}
        onClose={() => setIsExportMarkdownOpen(false)}
        bookmarks={filteredBookmarks}
        activeCategoryName={activeCategoryLabel}
      />
    </div>
  );
};
