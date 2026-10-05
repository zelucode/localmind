import React, { useMemo } from 'react';
import { BrandMark } from './BrandMark';
import { Plus, ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { ActiveView } from '../types';
import { TitleBarDragRegion, WindowControls } from './WindowControls';

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
      className="fixed top-0 inset-x-0 h-11 z-50 flex items-stretch border-b select-none transition-colors"
      style={{
        backgroundColor: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text)',
      }}
    >
      {/* Brand column: same width as the sidebar so its vertical edge continues under the title bar */}
      <div className="w-16 shrink-0 flex items-center justify-center">
        <button
          id="header-btn-brand"
          onClick={() => onNavigate('dashboard')}
          title="LocalMind Dashboard"
          className="p-1.5 rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            backgroundColor: 'var(--theme-primary)',
            color: 'var(--theme-primary-foreground, #000000)',
          }}
        >
          <BrandMark className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4 pl-4">
        {/* Left: page title / breadcrumbs (drag region) */}
        <TitleBarDragRegion className="flex items-center min-w-0 h-full">
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
              </div>
            )}
          </div>
        </TitleBarDragRegion>

        {/* Center: Global Search Trigger Bar */}
        {onOpenGlobalSearch ? (
          <div className="w-64 lg:w-96 justify-self-center hidden sm:block">
            <button
              id="header-btn-global-search"
              onClick={onOpenGlobalSearch}
              className="w-full h-7 px-3 rounded-lg border flex items-center justify-between text-xs transition-all shadow-2xs group cursor-pointer hover:opacity-90 active:scale-[0.99]"
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
                  className="px-1.5 py-px rounded border text-[10px] leading-4 font-mono font-semibold shadow-2xs"
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
        ) : (
          <div />
        )}

        {/* Right: drag filler, primary action, window controls */}
        <div className="flex items-center h-full min-w-0">
        <TitleBarDragRegion className="flex-1 h-full min-w-0" />
        <div className="flex items-center gap-2 shrink-0 pr-2">
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
        <WindowControls />
        </div>
      </div>
    </header>
  );
};
