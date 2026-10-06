import React, { useMemo, useState } from 'react';
import {
  Search,
  Star,
  X,
  Sparkles,
  Globe,
  Terminal,
  Palette,
  Network,
  Code2,
  Trash2,
  ArrowUpRight,
  List,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';
import { AITool, ToolCategory } from '../types';
import { ToolCard, getIconComponent, getScopeBadgeConfig, canExportConfig } from './ToolCard';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

type CategoryFilter = ToolCategory | 'favorites';
type ViewMode = 'list' | 'grid';
type SortKey = 'recommended' | 'name' | 'stars';

const STORAGE_VIEW_KEY = 'localmind_tools_view_v1';
const STORAGE_SORT_KEY = 'localmind_tools_sort_v1';

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

interface ToolsPageProps {
  tools: AITool[];
  defaultLaunchSearch: boolean;
  onToggleFavorite: (id: string) => void;
  onDeleteCustom: (id: string) => void;
  onLaunchQuickSearch: (tool: AITool) => void;
  onOpenConfigExporter: (providerId?: string) => void;
  onOpenRateLimitMatrix: () => void;
  onOpenAddModal: () => void;
}

const CATEGORIES: { id: CategoryFilter; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All AI Platforms', icon: Sparkles },
  { id: 'web-llm', label: 'Web LLMs & Search', icon: Globe },
  { id: 'coding-agent', label: 'Coding & Local Agents', icon: Terminal },
  { id: 'design-media', label: 'Design & Media', icon: Palette },
  { id: 'uniform-proxy', label: 'OmniRoute & Runners', icon: Network },
  { id: 'favorites', label: 'Favorites', icon: Star },
];

const pill = 'px-1.5 py-0.5 rounded border text-[10px] font-medium whitespace-nowrap';

export const ToolsPage: React.FC<ToolsPageProps> = ({
  tools,
  defaultLaunchSearch,
  onToggleFavorite,
  onDeleteCustom,
  onLaunchQuickSearch,
  onOpenConfigExporter,
  onOpenRateLimitMatrix,
  onOpenAddModal,
}) => {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [canEditFiles, setCanEditFiles] = useState(false);
  const [hasWebSearch, setHasWebSearch] = useState(false);
  const [noCreditCard, setNoCreditCard] = useState(false);
  const [freeKey, setFreeKey] = useState(false);
  const [view, setViewState] = useState<ViewMode>(() => readPref(STORAGE_VIEW_KEY, ['list', 'grid'] as const, 'list'));
  const [sort, setSortState] = useState<SortKey>(() =>
    readPref(STORAGE_SORT_KEY, ['recommended', 'name', 'stars'] as const, 'recommended')
  );

  const setView = (v: ViewMode) => {
    setViewState(v);
    savePref(STORAGE_VIEW_KEY, v);
  };
  const setSort = (s: SortKey) => {
    setSortState(s);
    savePref(STORAGE_SORT_KEY, s);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tools.length, favorites: 0 };
    for (const t of tools) {
      c[t.category] = (c[t.category] || 0) + 1;
      if (t.isFavorite) c.favorites += 1;
    }
    return c;
  }, [tools]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const result = tools.filter((tool) => {
      if (category === 'favorites') {
        if (!tool.isFavorite) return false;
      } else if (category !== 'all' && tool.category !== category) {
        return false;
      }
      if (canEditFiles && tool.scope !== 'local-agent' && tool.scope !== 'ide-plugin') return false;
      if (hasWebSearch && !tool.freeTier.hasWebSearch) return false;
      if (noCreditCard && tool.freeTier.creditCardRequired) return false;
      if (freeKey && !tool.freeTier.allowCustomApiKey) return false;
      if (q) {
        const hit =
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.freeTier.summary.toLowerCase().includes(q) ||
          tool.tags.some((t) => t.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'stars') result.sort((a, b) => (b.stars || 0) - (a.stars || 0));
    return result;
  }, [tools, category, query, canEditFiles, hasWebSearch, noCreditCard, freeKey, sort]);

  const anyFilter = canEditFiles || hasWebSearch || noCreditCard || freeKey || query !== '' || category !== 'all';
  const resetAll = () => {
    setCategory('all');
    setQuery('');
    setCanEditFiles(false);
    setHasWebSearch(false);
    setNoCreditCard(false);
    setFreeKey(false);
  };

  const toggles: { id: string; label: string; on: boolean; toggle: () => void }[] = [
    { id: 'pill-filter-local-files', label: 'Can edit local files', on: canEditFiles, toggle: () => setCanEditFiles((v) => !v) },
    { id: 'pill-filter-web-search', label: 'Live web search', on: hasWebSearch, toggle: () => setHasWebSearch((v) => !v) },
    { id: 'pill-filter-no-cc', label: 'No credit card', on: noCreditCard, toggle: () => setNoCreditCard((v) => !v) },
    { id: 'pill-filter-free-key', label: 'Free API key', on: freeKey, toggle: () => setFreeKey((v) => !v) },
  ];

  const railBtn = (active: boolean): React.CSSProperties =>
    active
      ? { backgroundColor: 'var(--theme-raised)', color: 'var(--theme-text)', fontWeight: 600 }
      : { color: 'var(--theme-text-secondary)' };

  const launchRow = (tool: AITool) => {
    const quick = defaultLaunchSearch && tool.quickSearchUrlTemplate;
    const cls =
      'px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap active:scale-95 hover:opacity-95';
    const style = { backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000000)' };
    return quick ? (
      <button id={`link-open-${tool.id}`} onClick={() => onLaunchQuickSearch(tool)} className={cls} style={style}>
        Launch <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    ) : (
      <a id={`link-open-${tool.id}`} href={tool.url} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
        Launch <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    );
  };

  const iconBtn =
    'p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-85';
  const iconBtnStyle = {
    backgroundColor: 'var(--theme-raised)',
    borderColor: 'var(--theme-border)',
    color: 'var(--theme-text-muted)',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[11rem_minmax(0,1fr)] gap-5 items-start">
      {/* Filter rail */}
      <aside className="flex flex-col gap-0.5 lg:sticky lg:top-0" aria-label="Filters">
        <h6 className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
          Category
        </h6>
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-cat-${id}`}
            onClick={() => setCategory(id)}
            aria-pressed={category === id}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer transition-colors hover:bg-[var(--theme-raised)]"
            style={railBtn(category === id)}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${id === 'favorites' ? 'text-amber-400' : ''}`} />
            <span className="flex-1 truncate">{label}</span>
            <span className="font-mono text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
              {counts[id] || 0}
            </span>
          </button>
        ))}

        <h6 className="px-2.5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
          Filter
        </h6>
        {toggles.map((t) => (
          <button
            key={t.id}
            id={t.id}
            onClick={t.toggle}
            aria-pressed={t.on}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer transition-colors hover:bg-[var(--theme-raised)]"
            style={t.on ? { backgroundColor: 'var(--theme-raised)', color: 'var(--theme-primary)', fontWeight: 600 } : { color: 'var(--theme-text-secondary)' }}
          >
            <span
              className="w-3.5 h-3.5 rounded border grid place-items-center text-[9px] shrink-0"
              style={{
                borderColor: t.on ? 'var(--theme-primary)' : 'var(--theme-border-strong, var(--theme-border))',
                backgroundColor: t.on ? 'var(--theme-primary)' : 'transparent',
                color: 'var(--theme-primary-foreground, #000)',
              }}
            >
              {t.on ? '✓' : ''}
            </span>
            {t.label}
          </button>
        ))}
        {anyFilter && (
          <button
            onClick={resetAll}
            className="mt-2 px-2.5 py-1 text-xs text-left underline cursor-pointer"
            style={{ color: 'var(--theme-primary)' }}
          >
            Reset all
          </button>
        )}
      </aside>

      <div className="min-w-0 space-y-3">
        {/* Toolbar: one search, sort, view */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[12rem]">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
              style={{ color: 'var(--theme-text)' }}
            />
            <input
              id="input-filter-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter tools by name, free credits, keywords..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs focus:outline-none"
              style={{
                backgroundColor: 'var(--theme-card)',
                border: '1px solid var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
                style={{ color: 'var(--theme-text)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            id="select-tools-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort tools"
            className="py-1.5 pl-2.5 pr-2 rounded-lg text-xs cursor-pointer focus:outline-none"
            style={{ backgroundColor: 'var(--theme-card)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' }}
          >
            <option value="recommended">Sort: Recommended</option>
            <option value="name">Sort: Name (A–Z)</option>
            <option value="stars">Sort: Most starred</option>
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
                id={`btn-tools-view-${mode}`}
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

        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Showing <strong style={{ color: 'var(--theme-text)' }}>{filtered.length}</strong> of{' '}
          <strong style={{ color: 'var(--theme-text)' }}>{tools.length}</strong> AI tools
        </p>

        {filtered.length === 0 ? (
          <div
            className="py-16 text-center rounded-2xl border border-dashed"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
              No AI platforms match your search criteria.
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              Try adjusting your filters or add a new custom AI platform.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={resetAll}
                className="px-4 py-2 text-xs font-semibold rounded-lg border cursor-pointer"
                style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
              >
                Reset All Filters
              </button>
              <button
                onClick={onOpenAddModal}
                className="px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
                style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000)' }}
              >
                Add Tool
              </button>
            </div>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
            {filtered.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onToggleFavorite={onToggleFavorite}
                onDeleteCustom={onDeleteCustom}
                onLaunchQuickSearch={onLaunchQuickSearch}
                defaultLaunchSearch={defaultLaunchSearch}
                onOpenConfigExporter={onOpenConfigExporter}
                onOpenRateLimitMatrix={onOpenRateLimitMatrix}
              />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-x-auto"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <table className="w-full text-xs min-w-[720px]">
              <thead>
                <tr>
                  {['Tool', 'Free tier', 'Good for', ''].map((h, i) => (
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
                {filtered.map((tool) => {
                  const Icon = getIconComponent(tool.logo);
                  const scope = getScopeBadgeConfig(tool.scope);
                  return (
                    <tr
                      key={tool.id}
                      id={`row-tool-${tool.id}`}
                      className="border-b last:border-b-0 hover:bg-[var(--theme-raised)]/50 transition-colors"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="p-2 rounded-lg border shrink-0"
                            style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-primary)' }}
                          >
                            <Icon className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold truncate">{tool.name}</span>
                              {tool.badge && (
                                <span
                                  className={pill}
                                  style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
                                >
                                  {tool.badge}
                                </span>
                              )}
                            </div>
                            <span title={scope.description} className="text-[11px]" style={{ color: 'var(--theme-primary)' }}>
                              {scope.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-middle max-w-[16rem]">
                        <span
                          title={tool.freeTier.limits || tool.freeTier.summary}
                          className="line-clamp-2"
                          style={{ color: 'var(--theme-text-secondary)' }}
                        >
                          {tool.freeTier.summary}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex flex-wrap gap-1 max-w-[14rem]">
                          {(tool.scope === 'local-agent' || tool.scope === 'ide-plugin') && (
                            <span className={pill} style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-success)' }}>
                              Edits local files
                            </span>
                          )}
                          {tool.freeTier.hasWebSearch && (
                            <span className={pill} style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}>
                              Live search
                            </span>
                          )}
                          {!tool.freeTier.creditCardRequired && (
                            <span className={pill} style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-success)' }}>
                              No card
                            </span>
                          )}
                          {tool.freeTier.allowCustomApiKey && (
                            <span className={pill} style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-primary)' }}>
                              Free key
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {tool.quickSearchUrlTemplate && (
                            <button
                              id={`btn-quick-search-${tool.id}`}
                              onClick={() => onLaunchQuickSearch(tool)}
                              title="Quickly search or prompt this AI"
                              aria-label={`Quick query ${tool.name}`}
                              className={iconBtn}
                              style={{ ...iconBtnStyle, color: 'var(--theme-primary)' }}
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canExportConfig(tool) && (
                            <button
                              id={`btn-config-exporter-${tool.id}`}
                              onClick={() => onOpenConfigExporter(tool.id)}
                              title="Export IDE or agent config"
                              aria-label={`Export config for ${tool.name}`}
                              className={iconBtn}
                              style={iconBtnStyle}
                            >
                              <Code2 className="w-3.5 h-3.5 text-sky-500" />
                            </button>
                          )}
                          {tool.isCustom && (
                            <ConfirmDeleteButton
                              name={tool.name}
                              onConfirm={() => onDeleteCustom(tool.id)}
                              className={iconBtn}
                              style={iconBtnStyle}
                            />
                          )}
                          <button
                            onClick={() => onToggleFavorite(tool.id)}
                            title={tool.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            aria-label={tool.isFavorite ? `Unfavorite ${tool.name}` : `Favorite ${tool.name}`}
                            aria-pressed={!!tool.isFavorite}
                            className={iconBtn}
                            style={iconBtnStyle}
                          >
                            <Star className={`w-3.5 h-3.5 ${tool.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          {launchRow(tool)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
