import React from 'react';
import { Search, Star, Sparkles, X, Terminal, Globe, Palette, Network, CheckCircle2 } from 'lucide-react';
import { ToolCategory } from '../types';

interface ToolFilterBarProps {
  activeCategory: ToolCategory | 'favorites';
  onSelectCategory: (cat: ToolCategory | 'favorites') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterCanEditFiles: boolean;
  onToggleCanEditFiles: () => void;
  filterHasWebSearch: boolean;
  onToggleHasWebSearch: () => void;
  filterNoCreditCard: boolean;
  onToggleNoCreditCard: () => void;
  filterFreeKey: boolean;
  onToggleFreeKey: () => void;
  totalCount: number;
  filteredCount: number;
  favoritesCount: number;
}

export const ToolFilterBar: React.FC<ToolFilterBarProps> = ({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  filterCanEditFiles,
  onToggleCanEditFiles,
  filterHasWebSearch,
  onToggleHasWebSearch,
  filterNoCreditCard,
  onToggleNoCreditCard,
  filterFreeKey,
  onToggleFreeKey,
  totalCount,
  filteredCount,
  favoritesCount,
}) => {
  const categories: { id: ToolCategory | 'favorites'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All AI Platforms', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'web-llm', label: 'Web LLMs & Search', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'coding-agent', label: 'Coding & Local Agents', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'design-media', label: 'Design & Media', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'uniform-proxy', label: 'OmniRoute & Local Runners', icon: <Network className="w-3.5 h-3.5" /> },
    {
      id: 'favorites',
      label: `Favorites (${favoritesCount})`,
      icon: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />,
    },
  ];

  const hasActiveFilterPills =
    filterCanEditFiles || filterHasWebSearch || filterNoCreditCard || filterFreeKey;

  const clearAllFilters = () => {
    if (filterCanEditFiles) onToggleCanEditFiles();
    if (filterHasWebSearch) onToggleHasWebSearch();
    if (filterNoCreditCard) onToggleNoCreditCard();
    if (filterFreeKey) onToggleFreeKey();
    if (searchQuery) onSearchChange('');
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b" style={{ borderColor: 'var(--theme-border)' }}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`tab-cat-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95"
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary-foreground, #000000)',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    }
                  : {
                      color: 'var(--theme-text-secondary)',
                      backgroundColor: 'transparent',
                    }
              }
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Capability Filter Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
            style={{ color: 'var(--theme-text)' }}
          />
          <input
            id="input-filter-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter tools by name, free credits, keywords..."
            className="w-full pl-9 pr-8 py-2 rounded-lg text-xs transition-colors focus:outline-none"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: 'var(--theme-text)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
              style={{ color: 'var(--theme-text)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="pill-filter-local-files"
            onClick={onToggleCanEditFiles}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: filterCanEditFiles ? 'var(--theme-raised)' : 'var(--theme-card)',
              borderColor: filterCanEditFiles ? 'var(--theme-primary)' : 'var(--theme-border)',
              color: filterCanEditFiles ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            }}
          >
            <CheckCircle2 className={`w-3 h-3 ${filterCanEditFiles ? 'text-emerald-500' : 'opacity-40'}`} />
            Can Edit Local Files
          </button>

          <button
            id="pill-filter-web-search"
            onClick={onToggleHasWebSearch}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: filterHasWebSearch ? 'var(--theme-raised)' : 'var(--theme-card)',
              borderColor: filterHasWebSearch ? 'var(--theme-primary)' : 'var(--theme-border)',
              color: filterHasWebSearch ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            }}
          >
            <Globe className={`w-3 h-3 ${filterHasWebSearch ? 'text-sky-500' : 'opacity-40'}`} />
            Live Web Search
          </button>

          <button
            id="pill-filter-no-cc"
            onClick={onToggleNoCreditCard}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: filterNoCreditCard ? 'var(--theme-raised)' : 'var(--theme-card)',
              borderColor: filterNoCreditCard ? 'var(--theme-primary)' : 'var(--theme-border)',
              color: filterNoCreditCard ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            }}
          >
            <span>No Credit Card</span>
          </button>

          <button
            id="pill-filter-free-key"
            onClick={onToggleFreeKey}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: filterFreeKey ? 'var(--theme-raised)' : 'var(--theme-card)',
              borderColor: filterFreeKey ? 'var(--theme-primary)' : 'var(--theme-border)',
              color: filterFreeKey ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            }}
          >
            <span>Free API Key</span>
          </button>

          {hasActiveFilterPills && (
            <button
              onClick={clearAllFilters}
              className="text-xs px-2 py-1 underline cursor-pointer"
              style={{ color: 'var(--theme-primary)' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Result Count Indicator */}
      <div className="flex items-center justify-between text-xs pt-1" style={{ color: 'var(--theme-text-muted)' }}>
        <span>
          Showing <strong style={{ color: 'var(--theme-text)' }}>{filteredCount}</strong> of{' '}
          <strong style={{ color: 'var(--theme-text)' }}>{totalCount}</strong> AI tools
        </span>
        {filteredCount === 0 && (
          <span className="text-amber-500 font-medium">
            No tools match current filters. Try resetting.
          </span>
        )}
      </div>
    </div>
  );
};
