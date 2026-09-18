/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveView } from './components/Sidebar';
import { Omnibar } from './components/Omnibar';
import { ScopeExplainer } from './components/ScopeExplainer';
import { OmniRouteWidget } from './components/OmniRouteWidget';
import { ToolFilterBar } from './components/ToolFilterBar';
import { ToolCard } from './components/ToolCard';
import { SettingsPage } from './components/SettingsPage';
import { AddToolModal } from './components/AddToolModal';
import { ApiKeyVaultModal } from './components/ApiKeyVaultModal';
import { AIAdvisorModal } from './components/AIAdvisorModal';
import { QuickSearchModal } from './components/QuickSearchModal';
import { IDEConfigExporterModal } from './components/IDEConfigExporterModal';
import { RateLimitMatrixModal } from './components/RateLimitMatrixModal';
import { BookmarksPage } from './components/BookmarksPage';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ExportImportBookmarksModal } from './components/ExportImportBookmarksModal';
import { StartupWelcomeModal } from './components/StartupWelcomeModal';
import { LoadingScreen } from './components/LoadingScreen';
import { INITIAL_AI_TOOLS } from './data/defaultTools';
import { DEFAULT_BOOKMARKS } from './data/defaultBookmarks';
import { AITool, StoredApiKey, ToolCategory, ToolBookmark } from './types';
import {
  defaultThemePresets,
  ThemePreset,
  applyThemeToDocument,
  parseCustomThemesJson,
} from './theme';

const STORAGE_TOOLS_KEY = 'ai_nexus_custom_tools_v1';
const STORAGE_KEYS_KEY = 'ai_nexus_api_keys_v1';
const STORAGE_FAVS_KEY = 'ai_nexus_favorites_v1';
const STORAGE_THEME_KEY = 'ai_nexus_theme_id_v1';
const STORAGE_ACCENT_KEY = 'ai_nexus_custom_accent_v1';
const STORAGE_THEMES_JSON_KEY = 'ai_nexus_custom_themes_json_v1';
const STORAGE_LAUNCH_SEARCH_KEY = 'ai_nexus_default_launch_search_v1';
const STORAGE_SCOPE_EXPLAINER_KEY = 'ai_nexus_show_scope_explainer_v1';
const STORAGE_BOOKMARKS_KEY = 'ai_nexus_bookmarks_v3';
const STORAGE_SHOW_STARTUP_KEY = 'ai_nexus_show_startup_v1';
const STORAGE_SHOW_LOADING_KEY = 'ai_nexus_show_loading_v1';

export default function App() {
  // Navigation view
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Theme state
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_THEME_KEY) || 'pastel-dusk';
  });

  const [customAccentColor, setCustomAccentColor] = useState<string | undefined>(() => {
    return localStorage.getItem(STORAGE_ACCENT_KEY) || undefined;
  });

  const [customThemeJson, setCustomThemeJson] = useState<string | undefined>(() => {
    return localStorage.getItem(STORAGE_THEMES_JSON_KEY) || undefined;
  });

  // App preferences
  const [defaultLaunchSearch, setDefaultLaunchSearch] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_LAUNCH_SEARCH_KEY) === 'true';
  });

  const [showScopeExplainer, setShowScopeExplainer] = useState<boolean>(() => {
    const val = localStorage.getItem(STORAGE_SCOPE_EXPLAINER_KEY);
    return val !== null ? val === 'true' : true;
  });

  // Available theme presets (combining defaults + any valid custom JSON)
  const presets = useMemo(() => {
    return parseCustomThemesJson(customThemeJson);
  }, [customThemeJson]);

  const activeThemePreset = useMemo<ThemePreset>(() => {
    return presets.find((p) => p.id === themeId) || presets[0] || defaultThemePresets[0];
  }, [presets, themeId]);

  // Apply theme to document element
  useEffect(() => {
    applyThemeToDocument(themeId, customAccentColor, customThemeJson);
  }, [themeId, customAccentColor, customThemeJson]);

  // Persist theme choice
  const handleSelectTheme = (id: string) => {
    setThemeId(id);
    localStorage.setItem(STORAGE_THEME_KEY, id);
  };

  const handleSetCustomAccent = (color: string | undefined) => {
    setCustomAccentColor(color);
    if (color) {
      localStorage.setItem(STORAGE_ACCENT_KEY, color);
    } else {
      localStorage.removeItem(STORAGE_ACCENT_KEY);
    }
  };

  const handleToggleLightDark = () => {
    if (activeThemePreset.mode === 'dark') {
      // Switch to blueprint-light or soft-paper
      const target = presets.find((p) => p.id === 'blueprint-light') || presets.find((p) => p.mode === 'light') || presets[0];
      handleSelectTheme(target.id);
    } else {
      // Switch to pastel-dusk or first dark preset
      const target = presets.find((p) => p.id === 'pastel-dusk') || presets.find((p) => p.mode === 'dark') || presets[0];
      handleSelectTheme(target.id);
    }
  };

  // Tools & Keys state
  const [tools, setTools] = useState<AITool[]>(() => {
    try {
      const savedCustom = localStorage.getItem(STORAGE_TOOLS_KEY);
      const savedFavs = localStorage.getItem(STORAGE_FAVS_KEY);
      const favIds: string[] = savedFavs ? JSON.parse(savedFavs) : [];
      const customTools: AITool[] = savedCustom ? JSON.parse(savedCustom) : [];

      const merged = [...INITIAL_AI_TOOLS, ...customTools].map((t) => ({
        ...t,
        isFavorite: favIds.includes(t.id),
      }));
      return merged;
    } catch {
      return INITIAL_AI_TOOLS;
    }
  });

  const [keys, setKeys] = useState<StoredApiKey[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCanEditFiles, setFilterCanEditFiles] = useState(false);
  const [filterHasWebSearch, setFilterHasWebSearch] = useState(false);
  const [filterNoCreditCard, setFilterNoCreditCard] = useState(false);
  const [filterFreeKey, setFilterFreeKey] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isKeyVaultOpen, setIsKeyVaultOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorPrompt, setAdvisorPrompt] = useState('');
  const [quickSearchTool, setQuickSearchTool] = useState<AITool | null>(null);
  const [isConfigExporterOpen, setIsConfigExporterOpen] = useState(false);
  const [configExporterProvider, setConfigExporterProvider] = useState<string | undefined>(undefined);
  const [isRateLimitMatrixOpen, setIsRateLimitMatrixOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isExportImportBookmarksOpen, setIsExportImportBookmarksOpen] = useState(false);

  // Loading Screen State
  const [showLoadingAnimation, setShowLoadingAnimation] = useState<boolean>(() => {
    const val = localStorage.getItem(STORAGE_SHOW_LOADING_KEY);
    return val !== null ? val === 'true' : true;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const val = localStorage.getItem(STORAGE_SHOW_LOADING_KEY);
    return val !== null ? val === 'true' : true;
  });

  const handleToggleShowLoadingAnimation = (show: boolean) => {
    setShowLoadingAnimation(show);
    try {
      localStorage.setItem(STORAGE_SHOW_LOADING_KEY, String(show));
    } catch {
      // Ignored
    }
  };

  const handleReplayLoadingAnimation = () => {
    setIsLoading(true);
  };

  // Startup Screen State
  const [showStartupScreen, setShowStartupScreen] = useState<boolean>(() => {
    const val = localStorage.getItem(STORAGE_SHOW_STARTUP_KEY);
    return val !== null ? val === 'true' : true;
  });

  const [isStartupScreenOpen, setIsStartupScreenOpen] = useState<boolean>(() => {
    // If loading animation is running, wait until loading completes before opening welcome launcher
    const loadingVal = localStorage.getItem(STORAGE_SHOW_LOADING_KEY);
    const willLoad = loadingVal !== null ? loadingVal === 'true' : true;
    if (willLoad) {
      return false;
    }
    const val = localStorage.getItem(STORAGE_SHOW_STARTUP_KEY);
    return val !== null ? val === 'true' : true;
  });

  const handleToggleShowStartupScreen = (show: boolean) => {
    setShowStartupScreen(show);
    try {
      localStorage.setItem(STORAGE_SHOW_STARTUP_KEY, String(show));
    } catch {
      // Ignored
    }
  };

  const handleLoadingFinish = () => {
    setIsLoading(false);
    if (showStartupScreen) {
      setIsStartupScreenOpen(true);
    }
  };

  // Bookmarks State (Completely separate list of online web tools)
  const [bookmarks, setBookmarks] = useState<ToolBookmark[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenIds = new Set<string>();
          const deduped: ToolBookmark[] = [];
          for (const item of parsed) {
            if (item && item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              deduped.push(item);
            }
          }
          if (deduped.length !== parsed.length) {
            try {
              localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(deduped));
            } catch {
              // Ignored
            }
          }
          return deduped;
        }
      }
    } catch {
      // Ignored
    }
    return DEFAULT_BOOKMARKS;
  });

  const [isAddBookmarkModalOpen, setIsAddBookmarkModalOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<ToolBookmark | null>(null);

  const saveBookmarksToStorage = (updated: ToolBookmark[]) => {
    setBookmarks(updated);
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  const handleAddOrUpdateBookmark = (bookmark: ToolBookmark) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === bookmark.id);
      let updated: ToolBookmark[];
      if (exists) {
        updated = prev.map((b) => (b.id === bookmark.id ? bookmark : b));
      } else {
        updated = [bookmark, ...prev];
      }
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const handleToggleBookmarkFavorite = (id: string) => {
    setBookmarks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const handleRecordBookmarkClick = (id: string) => {
    setBookmarks((prev) => {
      const updated = prev.map((b) =>
        b.id === id ? { ...b, clickCount: (b.clickCount || 0) + 1 } : b
      );
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  };

  const handleResetBookmarksToDefaults = () => {
    saveBookmarksToStorage(DEFAULT_BOOKMARKS);
  };

  const handleImportBookmarks = (
    imported: ToolBookmark[],
    mode: 'merge' | 'replace' | 'skip' = 'merge'
  ) => {
    if (mode === 'replace') {
      saveBookmarksToStorage(imported);
      return;
    }
    if (mode === 'skip') {
      const existingUrls = new Set(bookmarks.map((b) => b.url.toLowerCase()));
      const toAdd = imported.filter((b) => !existingUrls.has(b.url.toLowerCase()));
      saveBookmarksToStorage([...bookmarks, ...toAdd]);
      return;
    }
    // 'merge' mode by default
    const map = new Map<string, ToolBookmark>();
    bookmarks.forEach((b) => {
      map.set(b.id, b);
      map.set(b.url.toLowerCase(), b);
    });
    imported.forEach((b) => {
      const existing = map.get(b.id) || map.get(b.url.toLowerCase());
      if (existing) {
        const merged: ToolBookmark = {
          ...existing,
          ...b,
          id: existing.id,
          isFavorite: existing.isFavorite || b.isFavorite,
          clickCount: Math.max(existing.clickCount || 0, b.clickCount || 0),
        };
        map.set(existing.id, merged);
      } else {
        map.set(b.id, b);
      }
    });
    const deduped = Array.from(new Set(map.values()));
    saveBookmarksToStorage(deduped);
  };

  const handleOpenAddBookmarkModal = () => {
    setBookmarkToEdit(null);
    setIsAddBookmarkModalOpen(true);
  };

  const handleOpenEditBookmarkModal = (bm: ToolBookmark) => {
    setBookmarkToEdit(bm);
    setIsAddBookmarkModalOpen(true);
  };

  const handleOpenConfigExporter = (providerId?: string) => {
    setConfigExporterProvider(providerId);
    setIsConfigExporterOpen(true);
  };

  const handleOpenRateLimitMatrix = () => {
    setIsRateLimitMatrixOpen(true);
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or select
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Escape key closes whichever modal is open
      if (e.key === 'Escape') {
        if (isGlobalSearchOpen) {
          setIsGlobalSearchOpen(false);
          return;
        }
        if (isExportImportBookmarksOpen) {
          setIsExportImportBookmarksOpen(false);
          return;
        }
        if (isStartupScreenOpen) {
          setIsStartupScreenOpen(false);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isConfigExporterOpen) {
          setIsConfigExporterOpen(false);
          return;
        }
        if (isRateLimitMatrixOpen) {
          setIsRateLimitMatrixOpen(false);
          return;
        }
        if (isKeyVaultOpen) {
          setIsKeyVaultOpen(false);
          return;
        }
        if (isAdvisorOpen) {
          setIsAdvisorOpen(false);
          return;
        }
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
          return;
        }
        if (isAddBookmarkModalOpen) {
          setIsAddBookmarkModalOpen(false);
          setBookmarkToEdit(null);
          return;
        }
        if (quickSearchTool) {
          setQuickSearchTool(null);
          return;
        }
      }

      // Universal Command Palette: Cmd+K or Ctrl+K (works even if inside input)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      // '?' opens shortcuts modal
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // '/' focuses search bar
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="text"][placeholder*="Search"], input[type="text"][placeholder*="Filter"], input[placeholder*="search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Number keys 1, 2, 3 for view navigation
      if (e.key === '1') {
        e.preventDefault();
        setActiveView('dashboard');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        setActiveView('bookmarks');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        setActiveView('settings');
        return;
      }

      // Utility hotkeys
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setIsKeyVaultOpen(true);
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleOpenConfigExporter();
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsRateLimitMatrixOpen(true);
        return;
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleOpenAdvisor();
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleOpenAddBookmarkModal();
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToggleLightDark();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isGlobalSearchOpen,
    isShortcutsOpen,
    isConfigExporterOpen,
    isRateLimitMatrixOpen,
    isKeyVaultOpen,
    isAdvisorOpen,
    isAddModalOpen,
    isAddBookmarkModalOpen,
    quickSearchTool,
    activeThemePreset,
  ]);

  // Sync favorites
  const toggleFavorite = (id: string) => {
    setTools((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
      const favIds = next.filter((t) => t.isFavorite).map((t) => t.id);
      try {
        localStorage.setItem(STORAGE_FAVS_KEY, JSON.stringify(favIds));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  // Add custom tool
  const handleAddTool = (newTool: AITool) => {
    setTools((prev) => {
      const next = [newTool, ...prev];
      const customTools = next.filter((t) => t.isCustom);
      try {
        localStorage.setItem(STORAGE_TOOLS_KEY, JSON.stringify(customTools));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  // Delete custom tool
  const handleDeleteCustom = (id: string) => {
    setTools((prev) => {
      const next = prev.filter((t) => t.id !== id);
      const customTools = next.filter((t) => t.isCustom);
      try {
        localStorage.setItem(STORAGE_TOOLS_KEY, JSON.stringify(customTools));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  // API Key operations
  const handleAddKey = (newKey: StoredApiKey) => {
    setKeys((prev) => {
      const next = [newKey, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(next));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  const handleDeleteKey = (id: string) => {
    setKeys((prev) => {
      const next = prev.filter((k) => k.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(next));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  // Preferences toggles
  const handleToggleDefaultLaunchSearch = (val: boolean) => {
    setDefaultLaunchSearch(val);
    localStorage.setItem(STORAGE_LAUNCH_SEARCH_KEY, String(val));
  };

  const handleToggleShowScopeExplainer = (val: boolean) => {
    setShowScopeExplainer(val);
    localStorage.setItem(STORAGE_SCOPE_EXPLAINER_KEY, String(val));
  };

  // Full backup and restore
  const handleExportBackup = () => {
    const customTools = tools.filter((t) => t.isCustom);
    const favIds = tools.filter((t) => t.isFavorite).map((t) => t.id);
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      customTools,
      keys,
      favIds,
      themeId,
      customAccentColor,
      customThemeJson,
      preferences: {
        defaultLaunchSearch,
        showScopeExplainer,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-nexus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.customTools && Array.isArray(parsed.customTools)) {
        localStorage.setItem(STORAGE_TOOLS_KEY, JSON.stringify(parsed.customTools));
        const favIds: string[] = Array.isArray(parsed.favIds) ? parsed.favIds : [];
        localStorage.setItem(STORAGE_FAVS_KEY, JSON.stringify(favIds));

        setTools([...INITIAL_AI_TOOLS, ...parsed.customTools].map((t) => ({
          ...t,
          isFavorite: favIds.includes(t.id),
        })));
      }

      if (parsed.keys && Array.isArray(parsed.keys)) {
        localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(parsed.keys));
        setKeys(parsed.keys);
      }

      if (parsed.themeId && typeof parsed.themeId === 'string') {
        setThemeId(parsed.themeId);
        localStorage.setItem(STORAGE_THEME_KEY, parsed.themeId);
      }

      if (parsed.customAccentColor) {
        setCustomAccentColor(parsed.customAccentColor);
        localStorage.setItem(STORAGE_ACCENT_KEY, parsed.customAccentColor);
      }

      if (parsed.preferences) {
        if (typeof parsed.preferences.defaultLaunchSearch === 'boolean') {
          setDefaultLaunchSearch(parsed.preferences.defaultLaunchSearch);
          localStorage.setItem(STORAGE_LAUNCH_SEARCH_KEY, String(parsed.preferences.defaultLaunchSearch));
        }
        if (typeof parsed.preferences.showScopeExplainer === 'boolean') {
          setShowScopeExplainer(parsed.preferences.showScopeExplainer);
          localStorage.setItem(STORAGE_SCOPE_EXPLAINER_KEY, String(parsed.preferences.showScopeExplainer));
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleResetFactoryDefaults = () => {
    localStorage.removeItem(STORAGE_TOOLS_KEY);
    localStorage.removeItem(STORAGE_KEYS_KEY);
    localStorage.removeItem(STORAGE_FAVS_KEY);
    localStorage.removeItem(STORAGE_THEME_KEY);
    localStorage.removeItem(STORAGE_ACCENT_KEY);
    localStorage.removeItem(STORAGE_THEMES_JSON_KEY);
    localStorage.removeItem(STORAGE_LAUNCH_SEARCH_KEY);
    localStorage.removeItem(STORAGE_SCOPE_EXPLAINER_KEY);

    setTools(INITIAL_AI_TOOLS);
    setKeys([]);
    setThemeId('pastel-dusk');
    setCustomAccentColor(undefined);
    setCustomThemeJson(undefined);
    setDefaultLaunchSearch(false);
    setShowScopeExplainer(true);
  };

  const handleSaveCustomPresets = (newPresets: ThemePreset[]) => {
    const jsonStr = JSON.stringify(newPresets, null, 2);
    setCustomThemeJson(jsonStr);
    localStorage.setItem(STORAGE_THEMES_JSON_KEY, jsonStr);
  };

  const handleSaveCustomThemeJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCustomThemeJson(jsonStr);
        localStorage.setItem(STORAGE_THEMES_JSON_KEY, jsonStr);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Open Advisor with optional query
  const handleOpenAdvisor = (initialPrompt?: string) => {
    setAdvisorPrompt(initialPrompt || '');
    setIsAdvisorOpen(true);
  };

  // Scroll to omniroute widget
  const handleScrollToOmniRoute = () => {
    const el = document.getElementById('section-omniroute');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtered tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      // Category filter
      if (activeCategory === 'favorites') {
        if (!tool.isFavorite) return false;
      } else if (activeCategory !== 'all') {
        if (tool.category !== activeCategory) return false;
      }

      // Capability filters
      if (filterCanEditFiles) {
        if (tool.scope !== 'local-agent' && tool.scope !== 'ide-plugin') {
          return false;
        }
      }

      if (filterHasWebSearch) {
        if (!tool.freeTier.hasWebSearch) return false;
      }

      if (filterNoCreditCard) {
        if (tool.freeTier.creditCardRequired) return false;
      }

      if (filterFreeKey) {
        if (!tool.freeTier.allowCustomApiKey) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = tool.name.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        const matchSummary = tool.freeTier.summary.toLowerCase().includes(q);
        const matchTags = tool.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchSummary && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [
    tools,
    activeCategory,
    searchQuery,
    filterCanEditFiles,
    filterHasWebSearch,
    filterNoCreditCard,
    filterFreeKey,
  ]);

  const favoritesCount = useMemo(() => tools.filter((t) => t.isFavorite).length, [tools]);

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-150"
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
      }}
    >
      {/* Left Icon-Based Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenAdvisor={() => handleOpenAdvisor()}
        onOpenKeyVault={() => setIsKeyVaultOpen(true)}
        onOpenConfigExporter={() => handleOpenConfigExporter()}
        onOpenRateLimitMatrix={handleOpenRateLimitMatrix}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onScrollToOmniRoute={handleScrollToOmniRoute}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onOpenStartupScreen={() => setIsStartupScreenOpen(true)}
        activeTheme={activeThemePreset}
        onToggleLightDark={handleToggleLightDark}
        totalKeys={keys.length}
        totalBookmarks={bookmarks.length}
      />

      {/* Main Workspace Frame (offset for md:sidebar and mobile bottom nav) */}
      <div className="md:pl-16 pb-16 md:pb-0 flex-1 flex flex-col min-w-0">
        {/* Top Application Header (streamlined without sidebar duplicates) */}
        <Header
          activeView={activeView}
          onNavigate={setActiveView}
          totalTools={tools.length}
          totalBookmarks={bookmarks.length}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenAddBookmarkModal={handleOpenAddBookmarkModal}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        />

        {/* View Switcher: Settings Page vs Bookmarks Catalog vs Dashboard Hub */}
        {activeView === 'settings' ? (
          <main className="flex-1 w-full">
            <SettingsPage
              currentThemeId={themeId}
              customAccentColor={customAccentColor}
              onSelectTheme={handleSelectTheme}
              onSetCustomAccentColor={handleSetCustomAccent}
              onSaveCustomPresets={handleSaveCustomPresets}
              allPresets={presets}
              showScopeExplainer={showScopeExplainer}
              onToggleShowScopeExplainer={handleToggleShowScopeExplainer}
              defaultLaunchSearch={defaultLaunchSearch}
              onToggleDefaultLaunchSearch={handleToggleDefaultLaunchSearch}
              showOnStartup={showStartupScreen}
              onToggleShowOnStartup={handleToggleShowStartupScreen}
              onOpenStartupScreen={() => setIsStartupScreenOpen(true)}
              showLoadingAnimation={showLoadingAnimation}
              onToggleShowLoadingAnimation={handleToggleShowLoadingAnimation}
              onReplayLoadingAnimation={handleReplayLoadingAnimation}
              onOpenExportImportBookmarks={() => setIsExportImportBookmarksOpen(true)}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetFactoryDefaults={handleResetFactoryDefaults}
              onBackToDashboard={() => setActiveView('dashboard')}
            />
          </main>
        ) : activeView === 'bookmarks' ? (
          <main className="flex-1 w-full">
            <BookmarksPage
              bookmarks={bookmarks}
              onAddBookmark={handleAddOrUpdateBookmark}
              onUpdateBookmark={handleAddOrUpdateBookmark}
              onDeleteBookmark={handleDeleteBookmark}
              onToggleFavorite={handleToggleBookmarkFavorite}
              onRecordClick={handleRecordBookmarkClick}
              onResetToDefaults={handleResetBookmarksToDefaults}
              onImportBookmarks={handleImportBookmarks}
              onOpenAddModal={handleOpenAddBookmarkModal}
              onEditBookmark={handleOpenEditBookmarkModal}
              onOpenExportImportModal={() => setIsExportImportBookmarksOpen(true)}
            />
          </main>
        ) : (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Universal Omnibar */}
            <Omnibar
              onOpenAdvisor={handleOpenAdvisor}
              onOpenConfigExporter={() => handleOpenConfigExporter()}
              onOpenRateLimitMatrix={handleOpenRateLimitMatrix}
            />

            {/* Scope Explainer Banner (Web vs Local Code Agent) */}
            {showScopeExplainer && <ScopeExplainer />}

            {/* OmniRoute & Local AI Daemon Monitor Widget */}
            <OmniRouteWidget />

            {/* Tool Filter Bar */}
            <ToolFilterBar
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterCanEditFiles={filterCanEditFiles}
              onToggleCanEditFiles={() => setFilterCanEditFiles(!filterCanEditFiles)}
              filterHasWebSearch={filterHasWebSearch}
              onToggleHasWebSearch={() => setFilterHasWebSearch(!filterHasWebSearch)}
              filterNoCreditCard={filterNoCreditCard}
              onToggleNoCreditCard={() => setFilterNoCreditCard(!filterNoCreditCard)}
              filterFreeKey={filterFreeKey}
              onToggleFreeKey={() => setFilterFreeKey(!filterFreeKey)}
              totalCount={tools.length}
              filteredCount={filteredTools.length}
              favoritesCount={favoritesCount}
            />

            {/* Tools Grid */}
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onToggleFavorite={toggleFavorite}
                    onDeleteCustom={handleDeleteCustom}
                    onLaunchQuickSearch={(t) => setQuickSearchTool(t)}
                    defaultLaunchSearch={defaultLaunchSearch}
                    onOpenConfigExporter={(provId) => handleOpenConfigExporter(provId)}
                    onOpenRateLimitMatrix={handleOpenRateLimitMatrix}
                  />
                ))}
              </div>
            ) : (
              <div
                className="py-16 text-center rounded-2xl border border-dashed"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  No AI platforms match your search criteria.
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                  Try adjusting your filters or add a new custom AI platform.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                    setFilterCanEditFiles(false);
                    setFilterHasWebSearch(false);
                    setFilterNoCreditCard(false);
                    setFilterFreeKey(false);
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        )}

        {/* Modals */}
        <AddToolModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddTool={handleAddTool}
        />

        <ApiKeyVaultModal
          isOpen={isKeyVaultOpen}
          onClose={() => setIsKeyVaultOpen(false)}
          keys={keys}
          onAddKey={handleAddKey}
          onDeleteKey={handleDeleteKey}
          onOpenConfigExporter={(provId) => handleOpenConfigExporter(provId)}
        />

        <IDEConfigExporterModal
          isOpen={isConfigExporterOpen}
          onClose={() => setIsConfigExporterOpen(false)}
          savedKeys={keys}
          onSaveKey={handleAddKey}
          initialProvider={configExporterProvider}
        />

        <RateLimitMatrixModal
          isOpen={isRateLimitMatrixOpen}
          onClose={() => setIsRateLimitMatrixOpen(false)}
          onOpenExporterWithProvider={(provId) => handleOpenConfigExporter(provId)}
        />

        <AIAdvisorModal
          isOpen={isAdvisorOpen}
          onClose={() => setIsAdvisorOpen(false)}
          initialPrompt={advisorPrompt}
        />

        <QuickSearchModal
          tool={quickSearchTool}
          onClose={() => setQuickSearchTool(null)}
        />

        <AddBookmarkModal
          isOpen={isAddBookmarkModalOpen}
          onClose={() => {
            setIsAddBookmarkModalOpen(false);
            setBookmarkToEdit(null);
          }}
          onSaveBookmark={handleAddOrUpdateBookmark}
          bookmarkToEdit={bookmarkToEdit}
        />

        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        <GlobalSearchModal
          isOpen={isGlobalSearchOpen}
          onClose={() => setIsGlobalSearchOpen(false)}
          tools={tools}
          bookmarks={bookmarks}
          activeView={activeView}
          onNavigate={setActiveView}
          onOpenKeyVault={() => setIsKeyVaultOpen(true)}
          onOpenConfigExporter={(provId) => handleOpenConfigExporter(provId)}
          onOpenRateLimitMatrix={handleOpenRateLimitMatrix}
          onOpenAdvisor={(prompt) => handleOpenAdvisor(prompt)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenAddBookmarkModal={handleOpenAddBookmarkModal}
          onToggleLightDark={handleToggleLightDark}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenStartupScreen={() => setIsStartupScreenOpen(true)}
          onOpenExportImportBookmarks={() => setIsExportImportBookmarksOpen(true)}
          onReplayLoadingAnimation={handleReplayLoadingAnimation}
          activeTheme={activeThemePreset}
        />

        <ExportImportBookmarksModal
          isOpen={isExportImportBookmarksOpen}
          onClose={() => setIsExportImportBookmarksOpen(false)}
          bookmarks={bookmarks}
          onImportBookmarks={handleImportBookmarks}
          onResetToDefaults={handleResetBookmarksToDefaults}
        />

        <StartupWelcomeModal
          isOpen={isStartupScreenOpen}
          onClose={() => setIsStartupScreenOpen(false)}
          showOnStartup={showStartupScreen}
          onToggleShowOnStartup={handleToggleShowStartupScreen}
          onNavigate={setActiveView}
          onOpenKeyVault={() => setIsKeyVaultOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          totalTools={tools.length}
          totalBookmarks={bookmarks.length}
        />

        {/* Animated App Boot Loading Screen */}
        {isLoading && (
          <LoadingScreen
            onFinish={handleLoadingFinish}
            durationMs={1400}
            totalTools={tools.length}
            totalBookmarks={bookmarks.length}
          />
        )}

        {/* Desktop & Mobile Footer */}
        <footer
          className="mt-auto border-t py-6 text-center text-xs transition-colors"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>
              LocalMind Command Center • Active Theme:{' '}
              <strong style={{ color: 'var(--theme-text)' }}>{activeThemePreset.name}</strong>
            </span>
            <div className="flex items-center gap-4 text-[11px] opacity-80">
              <button
                onClick={() => setIsStartupScreenOpen(true)}
                className="hover:underline cursor-pointer flex items-center gap-1"
                style={{ color: 'var(--theme-primary)' }}
                title="Launch Startup Welcome Screen"
              >
                <span>Welcome Guide</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="hover:underline cursor-pointer flex items-center gap-1"
                style={{ color: 'var(--theme-primary)' }}
                title="View keyboard hotkeys"
              >
                <span>Shortcuts</span>
                <kbd className="px-1 py-0.2 rounded border text-[9px] font-mono">?</kbd>
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveView('settings')}
                className="hover:underline cursor-pointer"
                style={{ color: 'var(--theme-primary)' }}
              >
                Customize Theme
              </button>
              <span>•</span>
              <span>OmniRoute Enabled</span>
              <span>•</span>
              <span>Zero-Cost AI Catalog</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
