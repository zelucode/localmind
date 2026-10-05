import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  LayoutDashboard,
  Bookmark,
  Settings,
  KeyRound,
  Code2,
  Gauge,
  Sparkles,
  Plus,
  Sun,
  Moon,
  ExternalLink,
  Keyboard,
  ArrowRight,
  Compass,
  FileText,
  Star,
  Tag,
  Zap,
  FolderInput,
  Cpu,
} from 'lucide-react';
import { AITool, ToolBookmark, ActiveView } from '../types';
import { ThemePreset } from '../theme';
import { openExternal } from '../lib/tauri';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: AITool[];
  bookmarks: ToolBookmark[];
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenKeyVault: () => void;
  onOpenConfigExporter: (providerId?: string) => void;
  onOpenRateLimitMatrix: () => void;
  /** Omit to hide the Advisor action. */
  onOpenAdvisor?: (prompt?: string) => void;
  onOpenAddModal: () => void;
  onOpenAddBookmarkModal: () => void;
  onToggleLightDark: () => void;
  onOpenShortcuts: () => void;
  onOpenExportImportBookmarks?: () => void;
  onOpenStartupScreen?: () => void;
  onReplayLoadingAnimation?: () => void;
  activeTheme: ThemePreset;
}

type SearchCategory = 'all' | 'pages' | 'actions' | 'ai-tools' | 'bookmarks';

interface SearchResultItem {
  id: string;
  type: 'page' | 'action' | 'ai-tool' | 'bookmark' | 'external-search';
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  icon: React.ReactNode;
  url?: string;
  stars?: number;
  tags?: string[];
  action: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  tools,
  bookmarks,
  activeView,
  onNavigate,
  onOpenKeyVault,
  onOpenConfigExporter,
  onOpenRateLimitMatrix,
  onOpenAdvisor,
  onOpenAddModal,
  onOpenAddBookmarkModal,
  onToggleLightDark,
  onOpenShortcuts,
  onOpenExportImportBookmarks,
  onOpenStartupScreen,
  onReplayLoadingAnimation,
  activeTheme,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory('all');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Detect OS for keyboard shortcut display
  const isMac = useMemo(() => {
    return typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  // Construct search items
  const allItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];
    const seenIds = new Set<string>();

    const addItem = (item: SearchResultItem) => {
      let uniqueId = item.id;
      let counter = 1;
      while (seenIds.has(uniqueId)) {
        uniqueId = `${item.id}-${counter++}`;
      }
      seenIds.add(uniqueId);
      items.push({ ...item, id: uniqueId });
    };

    // 1. Pages / Navigation
    addItem({
      id: 'page-home',
      type: 'page',
      title: 'Home',
      subtitle: 'Quick launcher, status overview and favorites',
      categoryLabel: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-sky-400" />,
      action: () => {
        onNavigate('home');
        onClose();
      },
    });

    addItem({
      id: 'page-tools',
      type: 'page',
      title: 'AI Tools',
      subtitle: 'Browse the AI catalog, compare free tiers and filter by capability',
      categoryLabel: 'Navigation',
      icon: <Sparkles className="w-4 h-4 text-orange-400" />,
      action: () => {
        onNavigate('tools');
        onClose();
      },
    });

    addItem({
      id: 'page-runtimes',
      type: 'page',
      title: 'Runtimes',
      subtitle: 'OmniRoute and local AI daemons (Ollama, LM Studio, Jan)',
      categoryLabel: 'Navigation',
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigate('runtimes');
        onClose();
      },
    });

    addItem({
      id: 'page-bookmarks',
      type: 'page',
      title: 'Free Online Tool Bookmarks',
      subtitle: `270+ free web & developer utilities (regex testers, JSON formatters, SVG tools)`,
      categoryLabel: 'Navigation',
      icon: <Bookmark className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onNavigate('bookmarks');
        onClose();
      },
    });

    addItem({
      id: 'page-settings',
      type: 'page',
      title: 'Workspace Settings & Themes',
      subtitle: 'Customize theme palette, inspect CSS variables, backup & restore data',
      categoryLabel: 'Navigation',
      icon: <Settings className="w-4 h-4 text-amber-400" />,
      action: () => {
        onNavigate('settings');
        onClose();
      },
    });

    // 2. Global Actions & Modals
    addItem({
      id: 'action-key-vault',
      type: 'action',
      title: 'API Key Vault',
      subtitle: 'View, add, or test AES-GCM encrypted local API keys (Gemini, DeepSeek, Groq, OpenRouter)',
      categoryLabel: 'Security',
      icon: <KeyRound className="w-4 h-4 text-purple-400" />,
      action: () => {
        onClose();
        setTimeout(() => onOpenKeyVault(), 100);
      },
    });

    addItem({
      id: 'action-config-exporter',
      type: 'action',
      title: 'IDE Config Exporter',
      subtitle: 'Generate 1-click configs for Cursor (.cursorrules), Continue, Cline & Aider',
      categoryLabel: 'Developer Tool',
      icon: <Code2 className="w-4 h-4 text-sky-400" />,
      action: () => {
        onClose();
        setTimeout(() => onOpenConfigExporter(), 100);
      },
    });

    addItem({
      id: 'action-rate-limits',
      type: 'action',
      title: 'Rate Limit & Quotas Matrix',
      subtitle: 'Zero-cost rotation strategy, RPM, RPD and TPM allowances across providers',
      categoryLabel: 'Developer Tool',
      icon: <Gauge className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        setTimeout(() => onOpenRateLimitMatrix(), 100);
      },
    });

    if (onOpenAdvisor) addItem({
      id: 'action-advisor',
      type: 'action',
      title: 'AI Architecture Advisor',
      subtitle: 'Ask which free tool, local model, or API best fits your development task',
      categoryLabel: 'AI Utility',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onClose();
        setTimeout(() => onOpenAdvisor(), 100);
      },
    });

    addItem({
      id: 'action-export-import-bookmarks',
      type: 'action',
      title: 'Export & Import Bookmarks',
      subtitle: 'Backup, restore, or synchronize 270+ online developer tools (JSON, HTML Netscape, Markdown, CSV)',
      categoryLabel: 'Data & Tools',
      icon: <FolderInput className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        if (onOpenExportImportBookmarks) {
          setTimeout(() => onOpenExportImportBookmarks(), 100);
        }
      },
    });

    addItem({
      id: 'action-startup-screen',
      type: 'action',
      title: 'Startup Welcome Launcher',
      subtitle: 'Overview of 50+ frontier AI models, 270+ tools catalog, and quick start guides',
      categoryLabel: 'General',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        if (onOpenStartupScreen) {
          setTimeout(() => onOpenStartupScreen(), 100);
        }
      },
    });

    addItem({
      id: 'action-replay-loading-screen',
      type: 'action',
      title: 'Replay Boot Loading Animation',
      subtitle: 'Preview the animated LocalMind orbital core pulse and telemetry boot sequence',
      categoryLabel: 'General',
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onClose();
        if (onReplayLoadingAnimation) {
          setTimeout(() => onReplayLoadingAnimation(), 100);
        }
      },
    });

    addItem({
      id: 'action-add-bookmark',
      type: 'action',
      title: 'Bookmark New Online Tool',
      subtitle: 'Save a free web utility with tags, categories, and direct launch URL',
      categoryLabel: 'Action',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        setTimeout(() => onOpenAddBookmarkModal(), 100);
      },
    });

    addItem({
      id: 'action-add-tool',
      type: 'action',
      title: 'Add Custom AI Tool to Catalog',
      subtitle: 'Add a new LLM provider, IDE extension, or local CLI agent',
      categoryLabel: 'Action',
      icon: <Plus className="w-4 h-4 text-sky-400" />,
      action: () => {
        onClose();
        setTimeout(() => onOpenAddModal(), 100);
      },
    });

    addItem({
      id: 'action-toggle-theme',
      type: 'action',
      title: `Switch to ${activeTheme.mode === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: `Current active theme: ${activeTheme.name}`,
      categoryLabel: 'Appearance',
      icon: activeTheme.mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onToggleLightDark();
        onClose();
      },
    });

    addItem({
      id: 'action-keyboard-shortcuts',
      type: 'action',
      title: 'Keyboard Shortcuts Cheatsheet',
      subtitle: 'Quick reference for power-user hotkeys and view switching',
      categoryLabel: 'Help',
      icon: <Keyboard className="w-4 h-4 text-rose-400" />,
      action: () => {
        onClose();
        setTimeout(() => onOpenShortcuts(), 100);
      },
    });

    // 3. AI Catalog Tools
    tools.forEach((tool) => {
      addItem({
        id: `tool-${tool.id}`,
        type: 'ai-tool',
        title: tool.name,
        subtitle: tool.description,
        categoryLabel: `AI • ${tool.category}`,
        icon: <Zap className="w-4 h-4 text-indigo-400" />,
        url: tool.url,
        tags: tool.tags,
        action: () => {
          onClose();
          void openExternal(tool.url);
        },
      });
    });

    // 4. Free Online Tool Bookmarks
    bookmarks.forEach((bm) => {
      addItem({
        id: `bm-${bm.id}`,
        type: 'bookmark',
        title: bm.title,
        subtitle: bm.description,
        categoryLabel: `Bookmark • ${bm.category}`,
        icon: <Bookmark className="w-4 h-4 text-emerald-400" />,
        url: bm.url,
        stars: bm.stars,
        tags: bm.tags,
        action: () => {
          onClose();
          void openExternal(bm.url);
        },
      });
    });

    return items;
  }, [
    tools,
    bookmarks,
    activeTheme,
    onNavigate,
    onClose,
    onOpenKeyVault,
    onOpenConfigExporter,
    onOpenRateLimitMatrix,
    onOpenAdvisor,
    onOpenAddModal,
    onOpenAddBookmarkModal,
    onToggleLightDark,
    onOpenShortcuts,
  ]);

  // Filter items by activeCategory & search query
  const filteredItems = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();

    let list = allItems;

    // Filter by category tab
    if (activeCategory === 'pages') {
      list = list.filter((item) => item.type === 'page');
    } else if (activeCategory === 'actions') {
      list = list.filter((item) => item.type === 'action');
    } else if (activeCategory === 'ai-tools') {
      list = list.filter((item) => item.type === 'ai-tool');
    } else if (activeCategory === 'bookmarks') {
      list = list.filter((item) => item.type === 'bookmark');
    }

    // Filter by query string
    if (q) {
      list = list.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const subMatch = item.subtitle?.toLowerCase().includes(q);
        const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
        const catMatch = item.categoryLabel?.toLowerCase().includes(q);
        return titleMatch || subMatch || tagMatch || catMatch;
      });

      // If search query is present, add Perplexity and ChatGPT fallback entries at bottom
      const searchEntries: SearchResultItem[] = [
        {
          id: 'external-search-perplexity',
          type: 'external-search',
          title: `Search Perplexity for "${query}"`,
          subtitle: 'Search the web with source citations and free AI answers',
          categoryLabel: 'Web Search',
          icon: <Search className="w-4 h-4 text-sky-400" />,
          action: () => {
            onClose();
            void openExternal(`https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`);
          },
        },
        {
          id: 'external-search-chatgpt',
          type: 'external-search',
          title: `Ask ChatGPT "${query}"`,
          subtitle: 'Launch prompt directly in ChatGPT',
          categoryLabel: 'AI Engine',
          icon: <Compass className="w-4 h-4 text-emerald-400" />,
          action: () => {
            onClose();
            void openExternal(`https://chatgpt.com/?q=${encodeURIComponent(query)}`);
          },
        },
      ];

      return [...list.slice(0, 40), ...searchEntries];
    }

    // When query is empty, show curated suggestions:
    // Pages first, then primary Actions, and top starred tools/bookmarks
    return list.slice(0, 30);
  }, [allItems, activeCategory, query, onClose]);

  // Keep selectedIndex within bounds
  useEffect(() => {
    setSelectedIndex((prev) => {
      if (filteredItems.length === 0) return 0;
      if (prev >= filteredItems.length) return filteredItems.length - 1;
      return prev;
    });
  }, [filteredItems.length]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = resultsContainerRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        current.action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-global-search"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-[8vh] sm:pt-[12vh] bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          className="p-4 border-b flex items-center gap-3 relative"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <Search className="w-5 h-5 shrink-0 opacity-60" style={{ color: 'var(--theme-text)' }} />
          <input
            ref={inputRef}
            id="input-global-search"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, AI tools, 270+ bookmarks, or actions..."
            className="w-full bg-transparent text-sm sm:text-base font-medium placeholder:opacity-45 focus:outline-none"
            style={{ color: 'var(--theme-text)' }}
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md opacity-60 hover:opacity-100 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1 shrink-0 text-xs opacity-60">
            <kbd
              className="px-1.5 py-0.5 rounded border text-[10px] font-mono shadow-xs"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
              }}
            >
              Esc
            </kbd>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          className="px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto text-xs"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          {[
            { id: 'all', label: 'All' },
            { id: 'pages', label: 'Pages' },
            { id: 'actions', label: 'Actions' },
            { id: 'ai-tools', label: 'AI Catalog' },
            { id: 'bookmarks', label: 'Bookmarks (270+)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as SearchCategory);
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer"
              style={
                activeCategory === tab.id
                  ? {
                      backgroundColor: 'var(--theme-primary)',
                      color: 'var(--theme-primary-foreground, #000000)',
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--theme-text-secondary)',
                    }
              }
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] opacity-60 shrink-0 hidden sm:inline">
            {filteredItems.length} {filteredItems.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="overflow-y-auto p-2 space-y-1 flex-1 min-h-[220px]"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className="px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--theme-raised)',
                          boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                        }
                      : {
                          backgroundColor: 'transparent',
                        }
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="p-2 rounded-xl shrink-0 border"
                      style={{
                        backgroundColor: 'var(--theme-card)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs sm:text-sm font-semibold truncate"
                          style={{ color: 'var(--theme-text)' }}
                        >
                          {item.title}
                        </span>

                        {item.categoryLabel && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                            style={{
                              backgroundColor: 'var(--theme-raised)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--theme-text-muted)',
                            }}
                          >
                            {item.categoryLabel}
                          </span>
                        )}

                        {typeof item.stars === 'number' && item.stars > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {item.stars.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {item.subtitle && (
                        <p
                          className="text-[11px] sm:text-xs truncate mt-0.5"
                          style={{ color: 'var(--theme-text-secondary)' }}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.type === 'bookmark' || item.type === 'ai-tool' || item.type === 'external-search' ? (
                      <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    )}

                    {isSelected && (
                      <kbd
                        className="hidden sm:inline px-1.5 py-0.5 rounded text-[10px] font-mono border"
                        style={{
                          backgroundColor: 'var(--theme-card)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-primary)',
                        }}
                      >
                        ↵
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs font-medium" style={{ color: 'var(--theme-text)' }}>
                No matches found for "{query}"
              </p>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-secondary)' }}>
                Try searching for another keyword or switch category filter tabs.
              </p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div
          className="px-4 py-2.5 border-t flex items-center justify-between text-[11px]"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono">↑</kbd>
              <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono">↵</kbd>
              <span>to select</span>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono">Esc</kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-medium">
            <span>LocalMind Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
};
