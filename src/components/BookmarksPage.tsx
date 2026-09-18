import React, { useState, useMemo, useEffect } from 'react';
import {
  Bookmark,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Star,
  Sparkles,
  Wrench,
  Tag,
  FolderOpen,
  Filter,
  Download,
  Upload,
  RotateCcw,
  SlidersHorizontal,
  FileCode2,
  Trash2,
  Pencil,
  Eye,
  Info,
  Layers,
  Github,
  FileText,
  ChevronLeft,
  ChevronRight,
  FolderInput,
} from 'lucide-react';
import { ToolBookmark, BookmarkCategory } from '../types';
import { ExportMarkdownModal } from './ExportMarkdownModal';

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

export const BookmarksPage: React.FC<BookmarksPageProps> = ({
  bookmarks,
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onToggleFavorite,
  onRecordClick,
  onResetToDefaults,
  onImportBookmarks,
  onOpenAddModal,
  onEditBookmark,
  onOpenExportImportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookmarkCategory>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ai' | 'non-ai' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'stars' | 'clicks' | 'name' | 'recent'>('stars');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // Pagination & Markdown export state
  const [pageSize, setPageSize] = useState<number | 'all'>(24);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExportMarkdownOpen, setIsExportMarkdownOpen] = useState(false);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, typeFilter, activeTagFilter, sortBy, pageSize]);

  // Filter and sort bookmarks
  const filteredBookmarks = useMemo(() => {
    let result = bookmarks.filter((bm) => {
      // Type filter
      if (typeFilter === 'ai' && !bm.isAi) return false;
      if (typeFilter === 'non-ai' && bm.isAi) return false;
      if (typeFilter === 'favorites' && !bm.isFavorite) return false;

      // Category filter
      if (selectedCategory !== 'all' && bm.category !== selectedCategory) return false;

      // Tag filter
      if (activeTagFilter && !bm.tags.includes(activeTagFilter)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = bm.title.toLowerCase().includes(q);
        const inDesc = bm.description.toLowerCase().includes(q);
        const inUrl = bm.url.toLowerCase().includes(q);
        const inNotes = (bm.notes || '').toLowerCase().includes(q);
        const inTags = bm.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inUrl && !inNotes && !inTags) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'stars') {
        const starsA = a.stars || 0;
        const starsB = b.stars || 0;
        if (starsB !== starsA) return starsB - starsA;
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'clicks') {
        const clicksA = a.clickCount || 0;
        const clicksB = b.clickCount || 0;
        if (clicksB !== clicksA) return clicksB - clicksA;
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'recent') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      return 0;
    });

    return result;
  }, [bookmarks, typeFilter, selectedCategory, activeTagFilter, searchQuery, sortBy]);

  // Pagination calculations
  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredBookmarks.length / Number(pageSize)));
  }, [filteredBookmarks.length, pageSize]);

  const paginatedBookmarks = useMemo(() => {
    if (pageSize === 'all') return filteredBookmarks;
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredBookmarks.slice(start, start + size);
  }, [filteredBookmarks, currentPage, pageSize]);

  const activeCategoryLabel = useMemo(() => {
    return CATEGORY_TABS.find((c) => c.id === selectedCategory)?.label || 'All Tools';
  }, [selectedCategory]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Smooth scroll to top of tools section
    const gridElem = document.getElementById('bookmarks-grid-section');
    if (gridElem) {
      gridElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Statistics counters
  const totalCount = bookmarks.length;
  const nonAiCount = bookmarks.filter((b) => !b.isAi).length;
  const aiCount = bookmarks.filter((b) => b.isAi).length;
  const favoritesCount = bookmarks.filter((b) => b.isFavorite).length;

  const handleCopy = (bookmark: ToolBookmark) => {
    navigator.clipboard.writeText(bookmark.url);
    setCopiedId(bookmark.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const handleOpenTool = (bookmark: ToolBookmark) => {
    onRecordClick(bookmark.id);
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bookmarks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ai_nexus_bookmarks_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportBookmarks(parsed);
            alert(`Successfully imported ${parsed.length} bookmarks!`);
          }
        } catch {
          alert('Could not parse the selected file. Please make sure it is a valid JSON bookmarks file.');
        }
      };
    }
  };

  const getDomainFromUrl = (urlStr: string) => {
    try {
      const u = new URL(urlStr);
      return u.hostname.replace('www.', '');
    } catch {
      return urlStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Header */}
      <div
        className="rounded-2xl border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Independent Directory</span>
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--theme-raised)',
                color: 'var(--theme-text-secondary)',
              }}
            >
              {totalCount} Free Online Tools
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>
            Free Online Tool Bookmarks
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            Your quick-access launchpad for essential web tools — both free non-AI developer utilities (regex testers, JSON formatters, SVG optimizers, diff checkers) and instant free AI utilities. Click any link to jump straight to work.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            id="btn-add-bookmark"
            onClick={onOpenAddModal}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer hover:opacity-95 active:scale-95"
            style={{
              backgroundColor: 'var(--theme-primary)',
              color: 'var(--theme-primary-foreground, #000000)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Bookmark Tool</span>
          </button>

          <button
            id="btn-open-export-import-header"
            onClick={() => {
              if (onOpenExportImportModal) {
                onOpenExportImportModal();
              } else {
                setShowImportExport(true);
              }
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-primary)',
            }}
            title="Export JSON/HTML/CSV or Import bookmarks"
          >
            <FolderInput className="w-3.5 h-3.5" />
            <span>Export & Import</span>
          </button>

          <button
            id="btn-export-markdown-header"
            onClick={() => setIsExportMarkdownOpen(true)}
            className="px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
            title="Export filtered tools to GitHub README Markdown format"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Markdown</span>
          </button>

          <button
            id="btn-toggle-import-export"
            onClick={() => setShowImportExport(!showImportExport)}
            className="px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
            title="Quick Backup or Restore bookmarks"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Quick Backup</span>
          </button>
        </div>
      </div>

      {/* Backup & Import Tray (Collapsible) */}
      {showImportExport && (
        <div
          className="rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span style={{ color: 'var(--theme-text-secondary)' }}>
              Bookmarks are persisted locally in your browser. You can export a JSON backup, download Markdown docs, or restore defaults.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onOpenExportImportModal && (
              <button
                id="btn-tray-full-export-import"
                onClick={onOpenExportImportModal}
                className="px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  borderColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary-foreground, #000000)',
                }}
              >
                <FolderInput className="w-3.5 h-3.5" />
                <span>Full Export / Import Center</span>
              </button>
            )}

            <button
              onClick={() => setIsExportMarkdownOpen(true)}
              className="px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Export Markdown</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Quick JSON</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset bookmarks back to the curated default tools list? Any custom additions will be replaced.')) {
                  onResetToDefaults();
                }
              }}
              className="px-3 py-1.5 rounded-lg border text-rose-400 flex items-center gap-1.5 font-medium cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Control Center */}
      <div
        className="rounded-2xl border p-4 space-y-4 shadow-sm"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {/* Row 1: Search and Type Pills */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              id="input-search-bookmarks"
              type="text"
              placeholder="Search bookmarks by name, utility (e.g. regex, json, svg, diff), tag, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-100 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Type Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === 'all' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: typeFilter === 'all' ? 'var(--theme-primary)' : 'var(--theme-raised)',
                color: typeFilter === 'all' ? 'var(--theme-primary-foreground, #000000)' : 'var(--theme-text)',
              }}
            >
              All ({totalCount})
            </button>

            <button
              onClick={() => setTypeFilter('non-ai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                typeFilter === 'non-ai' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: typeFilter === 'non-ai' ? 'var(--theme-primary)' : 'var(--theme-raised)',
                color: typeFilter === 'non-ai' ? 'var(--theme-primary-foreground, #000000)' : 'var(--theme-text)',
              }}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              <span>Non-AI Web Utilities ({nonAiCount})</span>
            </button>

            <button
              onClick={() => setTypeFilter('ai')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                typeFilter === 'ai' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: typeFilter === 'ai' ? 'var(--theme-primary)' : 'var(--theme-raised)',
                color: typeFilter === 'ai' ? 'var(--theme-primary-foreground, #000000)' : 'var(--theme-text)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Free AI Utilities ({aiCount})</span>
            </button>

            <button
              onClick={() => setTypeFilter('favorites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                typeFilter === 'favorites' ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: typeFilter === 'favorites' ? 'var(--theme-primary)' : 'var(--theme-raised)',
                color: typeFilter === 'favorites' ? 'var(--theme-primary-foreground, #000000)' : 'var(--theme-text)',
              }}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Favorites ({favoritesCount})</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category tabs & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'font-bold border'
                    : 'opacity-65 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: selectedCategory === cat.id ? 'var(--theme-raised)' : 'transparent',
                  borderColor: selectedCategory === cat.id ? 'var(--theme-border)' : 'transparent',
                  color: selectedCategory === cat.id ? 'var(--theme-primary)' : 'var(--theme-text)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {activeTagFilter && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs border"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-primary)',
                }}
              >
                <Tag className="w-3 h-3" />
                <span>#{activeTagFilter}</span>
                <button
                  onClick={() => setActiveTagFilter(null)}
                  className="ml-1 opacity-60 hover:opacity-100 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 rounded-md border text-xs cursor-pointer focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <option value="stars">Top GitHub Stars</option>
                <option value="clicks">Most Used</option>
                <option value="name">Name (A-Z)</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value;
                  setPageSize(val === 'all' ? 'all' : Number(val));
                }}
                className="px-2 py-1 rounded-md border text-xs cursor-pointer focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
                <option value={96}>96 / page</option>
                <option value="all">All ({filteredBookmarks.length})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Tool Bookmarks */}
      {filteredBookmarks.length > 0 ? (
        <div id="bookmarks-grid-section" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedBookmarks.map((bookmark) => {
              const domain = getDomainFromUrl(bookmark.url);
              const isCopied = copiedId === bookmark.id;

            return (
              <div
                key={bookmark.id}
                id={`card-bookmark-${bookmark.id}`}
                className="group rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col justify-between hover:shadow-md"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs"
                        style={{
                          backgroundColor: bookmark.isAi ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: bookmark.isAi ? '#38bdf8' : '#f59e0b',
                          border: `1px solid ${bookmark.isAi ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        }}
                      >
                        {bookmark.isAi ? <Sparkles className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3
                            className="font-bold text-sm truncate group-hover:text-sky-400 transition-colors"
                            style={{ color: 'var(--theme-text)' }}
                          >
                            {bookmark.title}
                          </h3>
                        </div>
                        <span className="text-[11px] font-mono opacity-55 truncate block">
                          {domain}
                        </span>
                      </div>
                    </div>

                    {/* Star Favorite Action */}
                    <button
                      onClick={() => onToggleFavorite(bookmark.id)}
                      className="p-1.5 rounded-lg border transition-transform active:scale-90 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: bookmark.isFavorite ? '#f59e0b' : 'var(--theme-text-secondary)',
                      }}
                      title={bookmark.isFavorite ? 'Remove from favorites' : 'Star as favorite'}
                    >
                      <Star className={`w-3.5 h-3.5 ${bookmark.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Badges Row */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span
                      className="px-2 py-0.5 text-[10px] font-semibold rounded-md border"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: bookmark.isAi ? '#38bdf8' : '#10b981',
                      }}
                    >
                      {bookmark.freeTierBadge}
                    </span>

                    <span
                      className="px-2 py-0.5 text-[10px] font-medium rounded-md border capitalize"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-secondary)',
                      }}
                    >
                      {bookmark.category.replace('-', ' ')}
                    </span>

                    {bookmark.clickCount && bookmark.clickCount > 0 ? (
                      <span
                        className="px-1.5 py-0.5 text-[10px] rounded-md opacity-70"
                        style={{
                          backgroundColor: 'var(--theme-raised)',
                          color: 'var(--theme-text-secondary)',
                        }}
                      >
                        {bookmark.clickCount} visits
                      </span>
                    ) : null}
                  </div>

                  {/* Description */}
                  <p
                    className="text-xs line-clamp-3 leading-relaxed mb-3"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    {bookmark.description}
                  </p>

                  {/* Notes if available */}
                  {bookmark.notes && (
                    <div
                      className="mb-3 p-2 rounded-lg text-[11px] leading-snug border border-dashed"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-secondary)',
                      }}
                    >
                      <span className="font-semibold text-sky-400 mr-1">Tip:</span>
                      {bookmark.notes}
                    </div>
                  )}

                  {/* Tags */}
                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mb-4">
                      {bookmark.tags.slice(0, 4).map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                          className="px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer hover:opacity-100"
                          style={{
                            backgroundColor: activeTagFilter === tag ? 'var(--theme-primary)' : 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            color: activeTagFilter === tag ? 'var(--theme-primary-foreground, #000000)' : 'var(--theme-text-secondary)',
                          }}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Bottom Row */}
                <div
                  className="pt-3 border-t flex items-center justify-between gap-2"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  {/* Left: Edit / Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditBookmark(bookmark)}
                      className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-secondary)',
                      }}
                      title="Edit this bookmark"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCopy(bookmark)}
                      className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-80 flex items-center gap-1"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: isCopied ? '#10b981' : 'var(--theme-text-secondary)',
                      }}
                      title="Copy URL"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {bookmark.githubUrl && (
                      <a
                        href={bookmark.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-80 flex items-center gap-1 text-[11px]"
                        style={{
                          backgroundColor: 'var(--theme-raised)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text-secondary)',
                        }}
                        title="View open-source repository on GitHub"
                      >
                        <Github className="w-3.5 h-3.5" />
                        {bookmark.stars !== undefined && bookmark.stars > 0 && (
                          <span className="font-mono text-[10px] font-semibold">
                            {bookmark.stars >= 1000 ? `${(bookmark.stars / 1000).toFixed(1)}k` : bookmark.stars}
                          </span>
                        )}
                      </a>
                    )}

                    {bookmark.isCustom && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete bookmark "${bookmark.title}"?`)) {
                            onDeleteBookmark(bookmark.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border text-rose-400 transition-colors cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: 'var(--theme-raised)',
                          borderColor: 'var(--theme-border)',
                        }}
                        title="Delete custom bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right: Primary "Open Tool" Button */}
                  <button
                    onClick={() => handleOpenTool(bookmark)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95"
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary-foreground, #000000)',
                    }}
                  >
                    <span>Open Tool</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination & Load More Controls */}
        {pageSize !== 'all' && totalPages > 1 && (
          <div
            className="rounded-2xl border p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 mt-6"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            {/* Left: Range Summary */}
            <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              Showing{' '}
              <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                {(currentPage - 1) * Number(pageSize) + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                {Math.min(currentPage * Number(pageSize), filteredBookmarks.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                {filteredBookmarks.length}
              </span>{' '}
              online tools
            </div>

            {/* Middle: Page navigation buttons */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                id="btn-prev-page"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:opacity-85"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Dynamic Page Pill List */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                  })
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-1.5 text-xs opacity-40">
                          ...
                        </span>
                      );
                    }
                    const p = item as number;
                    const isActive = p === currentPage;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className="w-8 h-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                        style={
                          isActive
                            ? {
                                backgroundColor: 'var(--theme-primary)',
                                borderColor: 'var(--theme-primary)',
                                color: 'var(--theme-primary-foreground, #000000)',
                              }
                            : {
                                backgroundColor: 'var(--theme-raised)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text)',
                              }
                        }
                      >
                        {p}
                      </button>
                    );
                  })}
              </div>

              <button
                id="btn-next-page"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:opacity-85"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
                title="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Load More quick button */}
            <div className="flex items-center gap-2">
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  Load Next {Math.min(Number(pageSize), filteredBookmarks.length - currentPage * Number(pageSize))}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      ) : (
        /* Empty State */
        <div
          className="rounded-2xl border p-12 text-center space-y-4 max-w-md mx-auto"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div
            className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--theme-raised)',
              color: 'var(--theme-text-secondary)',
            }}
          >
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base" style={{ color: 'var(--theme-text)' }}>
              No bookmarks found
            </h3>
            <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              {searchQuery || activeTagFilter || typeFilter !== 'all' || selectedCategory !== 'all'
                ? 'No online tools match your active filter criteria.'
                : 'Your bookmark list is currently empty.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            {(searchQuery || activeTagFilter || typeFilter !== 'all' || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTagFilter(null);
                  setTypeFilter('all');
                  setSelectedCategory('all');
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer hover:opacity-85"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                Clear Filters
              </button>
            )}

            <button
              onClick={onOpenAddModal}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm cursor-pointer hover:opacity-95"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              Add New Bookmark
            </button>
          </div>
        </div>
      )}

      {/* Export to Markdown Modal */}
      <ExportMarkdownModal
        isOpen={isExportMarkdownOpen}
        onClose={() => setIsExportMarkdownOpen(false)}
        bookmarks={filteredBookmarks}
        activeCategoryName={activeCategoryLabel}
      />
    </div>
  );
};
