import React from 'react';
import {
  Home,
  LayoutGrid,
  Bookmark,
  Cpu,
  Code2,
  KeyRound,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { ActiveView } from '../types';

export type { ActiveView };

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  totalTools: number;
  totalBookmarks: number;
  totalKeys: number;
}

interface NavItem {
  view: ActiveView;
  label: string;
  icon: LucideIcon;
  count?: number;
}

/** Sidebar widths in px. The title bar's brand column mirrors these so its edge lines up. */
export const SIDEBAR_WIDTH = 208;
export const SIDEBAR_WIDTH_COLLAPSED = 64;

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  totalTools,
  totalBookmarks,
  totalKeys,
}) => {
  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: 'Discover',
      items: [
        { view: 'home', label: 'Home', icon: Home },
        { view: 'tools', label: 'AI Tools', icon: LayoutGrid, count: totalTools },
        { view: 'bookmarks', label: 'Bookmarks', icon: Bookmark, count: totalBookmarks },
      ],
    },
    {
      title: 'Local',
      items: [
        { view: 'runtimes', label: 'Runtimes', icon: Cpu },
        { view: 'configs', label: 'Configs & Limits', icon: Code2 },
      ],
    },
    {
      title: 'Secure',
      items: [{ view: 'vault', label: 'Key Vault', icon: KeyRound, count: totalKeys }],
    },
  ];

  const renderItem = ({ view, label, icon: Icon, count }: NavItem) => {
    const active = activeView === view;
    return (
      <button
        key={view}
        id={`sidebar-nav-${view}`}
        onClick={() => onNavigate(view)}
        title={collapsed ? label : undefined}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={`w-full flex items-center rounded-lg transition-colors cursor-pointer ${
          collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
        } ${active ? '' : 'opacity-75 hover:opacity-100'}`}
        style={
          active
            ? {
                backgroundColor: 'var(--theme-raised)',
                color: 'var(--theme-primary)',
                boxShadow: 'inset 0 0 0 1px var(--theme-border)',
              }
            : { color: 'var(--theme-text-secondary)' }
        }
      >
        <span className="relative shrink-0">
          <Icon className="w-[18px] h-[18px]" />
          {collapsed && view === 'vault' && count !== undefined && count > 0 && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            />
          )}
        </span>
        {!collapsed && (
          <>
            <span className={`flex-1 text-left text-[13px] truncate ${active ? 'font-semibold' : 'font-medium'}`}>
              {label}
            </span>
            {count !== undefined && (
              <span className="text-[11px] font-mono" style={{ color: 'var(--theme-text-muted)' }}>
                {count}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Desktop sidebar: sits below the title bar */}
      <aside
        id="app-left-sidebar"
        className="hidden md:flex fixed top-11 left-0 bottom-0 flex-col py-3 px-2 border-r z-40 overflow-y-auto transition-[width] duration-150"
        style={{
          width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <nav className="flex flex-col gap-0.5" aria-label="Main navigation">
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-0.5">
              {collapsed ? (
                <div className="h-px mx-3 my-2 first:hidden" style={{ backgroundColor: 'var(--theme-border)' }} />
              ) : (
                <h6
                  className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider first:pt-1"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {group.title}
                </h6>
              )}
              {group.items.map(renderItem)}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 pt-3">
          <button
            id="sidebar-btn-collapse"
            onClick={onToggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-full flex items-center rounded-lg transition-colors cursor-pointer opacity-75 hover:opacity-100 ${
              collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'
            }`}
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            {collapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
            {!collapsed && <span className="text-[13px] font-medium">Collapse</span>}
          </button>
          {renderItem({ view: 'settings', label: 'Settings', icon: Settings })}
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <div
        id="app-mobile-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 border-t z-40 flex items-center justify-around px-1 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {(
          [
            { view: 'home', label: 'Home', icon: Home },
            { view: 'tools', label: 'Tools', icon: LayoutGrid },
            { view: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
            { view: 'runtimes', label: 'Runtimes', icon: Cpu },
            { view: 'vault', label: 'Vault', icon: KeyRound },
            { view: 'settings', label: 'Settings', icon: Settings },
          ] as NavItem[]
        ).map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className="p-1.5 rounded-lg flex flex-col items-center gap-0.5 cursor-pointer"
            style={{
              color: activeView === view ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
              fontWeight: activeView === view ? 600 : 400,
            }}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[9px]">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
};
