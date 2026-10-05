import React from 'react';
import {
  LayoutDashboard,
  Bookmark,
  Sparkles,
  KeyRound,
  Cpu,
  Settings,
  Sun,
  Moon,
  Plus,
  Code2,
  Gauge,
  Keyboard,
  Search,
  Compass,
} from 'lucide-react';
import { ThemePreset } from '../theme';
import { ActiveView } from '../types';

export type { ActiveView };

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenAdvisor: () => void;
  onOpenKeyVault: () => void;
  onOpenConfigExporter?: () => void;
  onOpenRateLimitMatrix?: () => void;
  onOpenAddModal?: () => void;
  onScrollToOmniRoute?: () => void;
  onOpenShortcuts?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenStartupScreen?: () => void;
  activeTheme: ThemePreset;
  onToggleLightDark: () => void;
  totalKeys: number;
  totalBookmarks?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  onOpenAdvisor,
  onOpenKeyVault,
  onOpenConfigExporter,
  onOpenRateLimitMatrix,
  onOpenAddModal,
  onScrollToOmniRoute,
  onOpenShortcuts,
  onOpenGlobalSearch,
  onOpenStartupScreen,
  activeTheme,
  onToggleLightDark,
  totalKeys,
  totalBookmarks,
}) => {
  return (
    <>
      {/* Desktop Fixed Left Icon Sidebar */}
      <aside
        id="app-left-sidebar"
        className="hidden md:flex fixed top-11 left-0 bottom-0 w-16 flex-col items-center justify-between py-4 border-r z-40 transition-colors"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Navigation Icons */}
          <nav className="flex flex-col items-center gap-2">
            {/* Dashboard / Catalog */}
            <div className="relative group">
              <button
                id="sidebar-nav-dashboard"
                onClick={() => onNavigate('dashboard')}
                className="p-2.5 rounded-xl transition-all cursor-pointer"
                style={
                  activeView === 'dashboard'
                    ? {
                        backgroundColor: 'var(--theme-raised)',
                        color: 'var(--theme-primary)',
                        boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                      }
                    : {
                        color: 'var(--theme-text-muted)',
                      }
                }
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
              <div
                className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                AI Dashboard & Tools
              </div>
            </div>

            {/* Free Tool Bookmarks (AI & Non-AI) */}
            <div className="relative group">
              <button
                id="sidebar-nav-bookmarks"
                onClick={() => onNavigate('bookmarks')}
                className="p-2.5 rounded-xl transition-all relative cursor-pointer"
                style={
                  activeView === 'bookmarks'
                    ? {
                        backgroundColor: 'var(--theme-raised)',
                        color: 'var(--theme-primary)',
                        boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                      }
                    : {
                        color: 'var(--theme-text-muted)',
                      }
                }
              >
                <Bookmark className="w-5 h-5" />
                {totalBookmarks !== undefined && totalBookmarks > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                  />
                )}
              </button>
              <div
                className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                Free Tool Bookmarks ({totalBookmarks ?? 0})
              </div>
            </div>

            {/* IDE & Agent Config Exporter */}
            {onOpenConfigExporter && (
              <div className="relative group">
                <button
                  id="sidebar-nav-config-exporter"
                  onClick={onOpenConfigExporter}
                  className="p-2.5 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  <Code2 className="w-5 h-5" />
                </button>
                <div
                  className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  IDE & Agent Config Exporter
                </div>
              </div>
            )}

            {/* Rate-Limit & Rotation Matrix */}
            {onOpenRateLimitMatrix && (
              <div className="relative group">
                <button
                  id="sidebar-nav-rate-matrix"
                  onClick={onOpenRateLimitMatrix}
                  className="p-2.5 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  <Gauge className="w-5 h-5" />
                </button>
                <div
                  className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  Rate-Limits & Rotation Matrix
                </div>
              </div>
            )}

            {/* AI Advisor Modal */}
            <div className="relative group">
              <button
                id="sidebar-nav-advisor"
                onClick={onOpenAdvisor}
                className="p-2.5 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <div
                className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                AI Architecture Advisor
              </div>
            </div>

            {/* API Key Vault */}
            <div className="relative group">
              <button
                id="sidebar-nav-vault"
                onClick={onOpenKeyVault}
                className="p-2.5 rounded-xl transition-all relative cursor-pointer opacity-70 hover:opacity-100"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <KeyRound className="w-5 h-5" />
                {totalKeys > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                  />
                )}
              </button>
              <div
                className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                API Key Vault ({totalKeys})
              </div>
            </div>

            {/* OmniRoute & Daemon status */}
            <div className="relative group">
              <button
                id="sidebar-nav-omniroute"
                onClick={() => {
                  if (activeView !== 'dashboard') {
                    onNavigate('dashboard');
                    setTimeout(() => onScrollToOmniRoute?.(), 100);
                  } else {
                    onScrollToOmniRoute?.();
                  }
                }}
                className="p-2.5 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
                style={{ color: 'var(--theme-text-muted)' }}
              >
                <Cpu className="w-5 h-5" />
              </button>
              <div
                className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                OmniRoute & Local Daemons
              </div>
            </div>

            {/* Add Custom Tool */}
            {onOpenAddModal && (
              <div className="relative group">
                <button
                  id="sidebar-nav-add-tool"
                  onClick={onOpenAddModal}
                  className="p-2.5 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  <Plus className="w-5 h-5" />
                </button>
                <div
                  className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  Add Custom AI Tool
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Actions: Quick Theme Switcher & Settings */}
        <div className="flex flex-col items-center gap-2">
          {/* Quick Mode Toggle (Light/Dark) */}
          <div className="relative group">
            <button
              id="sidebar-btn-theme-toggle"
              onClick={onToggleLightDark}
              className="p-2.5 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
              style={{ color: 'var(--theme-text-muted)' }}
              title={`Switch to ${activeTheme.mode === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {activeTheme.mode === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-500" />
              )}
            </button>
            <div
              className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            >
              Toggle {activeTheme.mode === 'dark' ? 'Light' : 'Dark'} Mode (T)
            </div>
          </div>

          {/* Keyboard Shortcuts Trigger */}
          {onOpenShortcuts && (
            <div className="relative group">
              <button
                id="sidebar-btn-shortcuts"
                onClick={onOpenShortcuts}
                className="p-2.5 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
                style={{ color: 'var(--theme-text-muted)' }}
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-5 h-5" />
              </button>
              <div
                className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                Keyboard Shortcuts (?)
              </div>
            </div>
          )}

          {/* Startup Welcome Screen Trigger */}
          {onOpenStartupScreen && (
            <div className="relative group">
              <button
                id="sidebar-btn-startup-screen"
                onClick={onOpenStartupScreen}
                className="p-2.5 rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
                style={{ color: 'var(--theme-text-muted)' }}
                title="Welcome & Quick Start Launcher"
              >
                <Compass className="w-5 h-5" />
              </button>
              <div
                className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                Welcome & Quick Start
              </div>
            </div>
          )}

          {/* Settings Page Nav */}
          <div className="relative group">
            <button
              id="sidebar-nav-settings"
              onClick={() => onNavigate('settings')}
              className="p-2.5 rounded-xl transition-all cursor-pointer"
              style={
                activeView === 'settings'
                  ? {
                      backgroundColor: 'var(--theme-raised)',
                      color: 'var(--theme-primary)',
                      boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                    }
                  : {
                      color: 'var(--theme-text-muted)',
                    }
              }
            >
              <Settings className="w-5 h-5" />
            </button>
            <div
              className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            >
              Hub Settings & Themes
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div
        id="app-mobile-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 border-t z-40 flex items-center justify-around px-1 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer"
          style={{
            color: activeView === 'dashboard' ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
            fontWeight: activeView === 'dashboard' ? 600 : 400,
          }}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[9px]">Hub</span>
        </button>

        <button
          id="mobile-nav-bookmarks"
          onClick={() => onNavigate('bookmarks')}
          className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer"
          style={{
            color: activeView === 'bookmarks' ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
            fontWeight: activeView === 'bookmarks' ? 600 : 400,
          }}
        >
          <Bookmark className="w-4 h-4" />
          <span className="text-[9px]">Bookmarks</span>
        </button>

        {onOpenGlobalSearch && (
          <button
            id="mobile-nav-search"
            onClick={onOpenGlobalSearch}
            className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer opacity-80 hover:opacity-100"
            style={{ color: 'var(--theme-primary)' }}
          >
            <Search className="w-4 h-4" />
            <span className="text-[9px]">Search</span>
          </button>
        )}

        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <Keyboard className="w-4 h-4" />
            <span className="text-[9px]">Keys (?)</span>
          </button>
        )}

        {onOpenConfigExporter && (
          <button
            onClick={onOpenConfigExporter}
            className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <Code2 className="w-4 h-4" />
            <span className="text-[9px]">Configs</span>
          </button>
        )}

        {onOpenRateLimitMatrix && (
          <button
            onClick={onOpenRateLimitMatrix}
            className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            <Gauge className="w-4 h-4" />
            <span className="text-[9px]">Limits</span>
          </button>
        )}

        <button
          onClick={onOpenKeyVault}
          className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer opacity-70 hover:opacity-100"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <KeyRound className="w-4 h-4" />
          <span className="text-[9px]">Keys ({totalKeys})</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer"
          style={{
            color: activeView === 'settings' ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
            fontWeight: activeView === 'settings' ? 600 : 400,
          }}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[9px]">Settings</span>
        </button>
      </div>
    </>
  );
};
