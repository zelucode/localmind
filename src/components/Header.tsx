import React, { useMemo } from 'react';
import { BrandMark } from './BrandMark';
import { Plus, ArrowLeft, ChevronRight, Bookmark, Search } from 'lucide-react';
import { ActiveView } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  totalTools: number;
  totalBookmarks?: number;
  totalKeys?: number;
  activeThemeName?: string;
  onOpenAddModal: () => void;
  onOpenAddBookmarkModal?: () => void;
  onScrollToOmniRoute?: () => void;
  onOpenGlobalSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  totalTools,
  totalBookmarks = 0,
  onOpenAddModal,
  onOpenAddBookmarkModal,
  onOpenGlobalSearch,
}) => {
  const isMac = useMemo(() => {
    return typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  return (
    <header
      id="app-top-header"
      className="border-b sticky top-0 z-30 transition-colors backdrop-blur-md"
      style={{
        backgroundColor: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Dynamic Context & Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div
            className="p-2 rounded-xl shadow-sm transition-transform hover:scale-105 shrink-0 hidden sm:flex"
            style={{
              backgroundColor: 'var(--theme-primary)',
              color: 'var(--theme-primary-foreground, #000000)',
            }}
          >
            {activeView === 'bookmarks' ? <Bookmark className="w-4 h-4" /> : <BrandMark className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            {activeView === 'settings' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="header-breadcrumb-home"
                  onClick={() => onNavigate('dashboard')}
                  className="text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1 opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>LocalMind</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                <span
                  className="text-xs sm:text-sm font-bold tracking-tight"
                  style={{ color: 'var(--theme-text)' }}
                >
                  Settings
                </span>
              </div>
            ) : activeView === 'bookmarks' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="header-breadcrumb-home-bm"
                  onClick={() => onNavigate('dashboard')}
                  className="text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1 opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">LocalMind</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 hidden sm:inline" />
                <div>
                  <h1
                    className="text-xs sm:text-sm font-bold tracking-tight"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    Bookmarks
                  </h1>
                </div>
                <span className="opacity-40 text-xs hidden md:inline">•</span>
                <span className="text-[11px] opacity-70 hidden md:inline">
                  {totalBookmarks} Tools
                </span>
              </div>
            ) : (
              <div>
                <h1
                  className="text-sm sm:text-base font-bold tracking-tight"
                  style={{ color: 'var(--theme-text)' }}
                >
                  LocalMind
                </h1>
                <div
                  className="flex items-center gap-2 text-[11px] mt-0.5"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  <span className="hidden sm:inline">Directory</span>
                  <span className="opacity-40 hidden sm:inline">•</span>
                  <span>{totalTools} AI Platforms</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Global Search Trigger Bar */}
        {onOpenGlobalSearch && (
          <div className="flex-1 max-w-md mx-2">
            <button
              id="header-btn-global-search"
              onClick={onOpenGlobalSearch}
              className="w-full px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-all shadow-2xs group cursor-pointer hover:opacity-90 active:scale-[0.99]"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              title={`Global Search (${isMac ? '⌘K' : 'Ctrl+K'})`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 opacity-50 shrink-0 group-hover:opacity-80 transition-opacity" />
                <span className="truncate opacity-65 text-xs hidden sm:inline">
                  Search tools, 270+ bookmarks, actions...
                </span>
                <span className="truncate opacity-65 text-xs sm:hidden">
                  Search anything...
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-1.5">
                <kbd
                  className="px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-semibold shadow-2xs"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  {isMac ? '⌘K' : 'Ctrl+K'}
                </kbd>
              </div>
            </button>
          </div>
        )}

        {/* Right: Dynamic Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          {activeView === 'settings' ? (
            <button
              id="header-btn-back-hub"
              onClick={() => onNavigate('dashboard')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Hub</span>
            </button>
          ) : activeView === 'bookmarks' ? (
            <div className="flex items-center gap-2">
              <button
                id="header-btn-back-hub-bm"
                onClick={() => onNavigate('dashboard')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-80 hidden sm:flex"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>AI Hub</span>
              </button>
              <button
                id="btn-header-add-bookmark"
                onClick={onOpenAddBookmarkModal}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary-foreground, #000000)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bookmark Tool</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-nav-add-tool"
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tool</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
