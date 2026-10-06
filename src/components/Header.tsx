import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrandMark } from './BrandMark';
import {
  Plus,
  Search,
  Sun,
  Moon,
  CircleHelp,
  Keyboard,
  Compass,
  Info,
  BookOpen,
  Bug,
} from 'lucide-react';
import { ActiveView } from '../types';
import { TitleBarDragRegion, WindowControls } from './WindowControls';

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  sidebarCollapsed: boolean;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenAddBookmarkModal?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenShortcuts: () => void;
  onOpenWelcome: () => void;
  onOpenAbout: () => void;
  onOpenReportProblem: () => void;
}

const PAGE_TITLES: Record<ActiveView, string> = {
  home: 'Home',
  tools: 'AI Tools',
  bookmarks: 'Bookmarks',
  runtimes: 'Runtimes',
  configs: 'Configs & Limits',
  vault: 'Key Vault',
  settings: 'Settings',
};

const iconBtn =
  'h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer opacity-70 hover:opacity-100 hover:bg-[var(--theme-raised)]';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  disabled?: boolean;
  onSelect?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, hint, disabled, onSelect }) => (
  <button
    role="menuitem"
    disabled={disabled}
    onClick={onSelect}
    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-md transition-colors ${
      disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--theme-raised)]'
    }`}
    style={{ color: 'var(--theme-text)' }}
  >
    <span className="shrink-0 opacity-70">{icon}</span>
    <span className="flex-1">{label}</span>
    {hint && (
      <span className="text-[10px] font-mono opacity-60" style={{ color: 'var(--theme-text-muted)' }}>
        {hint}
      </span>
    )}
  </button>
);

const HelpMenu: React.FC<{
  onOpenShortcuts: () => void;
  onOpenWelcome: () => void;
  onOpenAbout: () => void;
  onOpenReportProblem: () => void;
}> = ({ onOpenShortcuts, onOpenWelcome, onOpenAbout, onOpenReportProblem }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <div ref={ref} className="relative">
      <button
        id="header-btn-help"
        onClick={() => setOpen((v) => !v)}
        title="Help"
        aria-label="Help"
        aria-haspopup="menu"
        aria-expanded={open}
        className={iconBtn}
        style={{ color: 'var(--theme-text)' }}
      >
        <CircleHelp className="w-4 h-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-60 p-1 rounded-xl border shadow-xl z-[60]"
          style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
        >
          <MenuItem
            icon={<Keyboard className="w-3.5 h-3.5" />}
            label="Keyboard Shortcuts"
            hint="?"
            onSelect={pick(onOpenShortcuts)}
          />
          <MenuItem
            icon={<Compass className="w-3.5 h-3.5" />}
            label="Welcome & Quick Start"
            onSelect={pick(onOpenWelcome)}
          />
          <div className="h-px my-1" style={{ backgroundColor: 'var(--theme-border)' }} />
          <MenuItem icon={<Info className="w-3.5 h-3.5" />} label="About LocalMind" onSelect={pick(onOpenAbout)} />
          <MenuItem icon={<BookOpen className="w-3.5 h-3.5" />} label="Documentation" hint="Soon" disabled />
          <div className="h-px my-1" style={{ backgroundColor: 'var(--theme-border)' }} />
          <MenuItem icon={<Bug className="w-3.5 h-3.5" />} label="Report a Problem" onSelect={pick(onOpenReportProblem)} />
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  sidebarCollapsed,
  themeMode,
  onToggleTheme,
  onOpenAddModal,
  onOpenAddBookmarkModal,
  onOpenGlobalSearch,
  onOpenShortcuts,
  onOpenWelcome,
  onOpenAbout,
  onOpenReportProblem,
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
      <div
        className={`shrink-0 flex items-center ${
          sidebarCollapsed ? 'w-16 justify-center' : 'w-16 md:w-52 justify-center md:justify-start md:pl-4 md:gap-2.5'
        }`}
      >
        <button
          id="header-btn-brand"
          onClick={() => onNavigate('home')}
          title="LocalMind Home"
          className="p-1.5 rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          style={{
            backgroundColor: 'var(--theme-primary)',
            color: 'var(--theme-primary-foreground, #000000)',
          }}
        >
          <BrandMark className="w-5 h-5" />
        </button>
        {!sidebarCollapsed && (
          <span className="hidden md:inline text-sm font-bold tracking-tight truncate">LocalMind</span>
        )}
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4 pl-4">
        {/* Left: current page title (drag region) */}
        <TitleBarDragRegion className="flex items-center min-w-0 h-full">
          <h1 className="text-sm font-semibold tracking-tight truncate" style={{ color: 'var(--theme-text)' }}>
            {PAGE_TITLES[activeView]}
          </h1>
        </TitleBarDragRegion>

        {/* Center: global search trigger */}
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
                <span className="truncate opacity-65 text-xs">Search tools, bookmarks, actions...</span>
              </div>
              <kbd
                className="px-1.5 py-px rounded border text-[10px] leading-4 font-mono font-semibold shadow-2xs shrink-0 ml-1.5"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-primary)',
                }}
              >
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Right: drag filler, contextual action, theme + help, window controls */}
        <div className="flex items-center h-full min-w-0">
          <TitleBarDragRegion className="flex-1 h-full min-w-0" />
          <div className="flex items-center gap-1.5 shrink-0 pr-2">
            {onOpenGlobalSearch && (
              <button
                onClick={onOpenGlobalSearch}
                title="Search"
                aria-label="Search"
                className={`${iconBtn} sm:hidden`}
                style={{ color: 'var(--theme-text)' }}
              >
                <Search className="w-4 h-4" />
              </button>
            )}
            {(activeView === 'home' || activeView === 'tools') && (
              <button
                id="btn-nav-add-tool"
                onClick={onOpenAddModal}
                className="mr-1 px-3 py-1 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary-foreground, #000000)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tool</span>
              </button>
            )}
            {activeView === 'bookmarks' && onOpenAddBookmarkModal && (
              <button
                id="btn-header-add-bookmark"
                onClick={onOpenAddBookmarkModal}
                className="mr-1 px-3 py-1 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary-foreground, #000000)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bookmark Tool</span>
              </button>
            )}
            <button
              id="header-btn-theme"
              onClick={onToggleTheme}
              title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode (T)`}
              aria-label="Toggle light and dark mode"
              className={iconBtn}
              style={{ color: 'var(--theme-text)' }}
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <HelpMenu
              onOpenShortcuts={onOpenShortcuts}
              onOpenWelcome={onOpenWelcome}
              onOpenAbout={onOpenAbout}
              onOpenReportProblem={onOpenReportProblem}
            />
          </div>
          <WindowControls />
        </div>
      </div>
    </header>
  );
};
