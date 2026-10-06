/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar, ActiveView, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { AboutModal } from './components/AboutModal';
import { OmniRouteWidget } from './components/OmniRouteWidget';
import { ToolsPage } from './components/ToolsPage';
import { SettingsPage } from './components/SettingsPage';
import { AddToolModal } from './components/AddToolModal';
import { ApiKeyVaultModal } from './components/ApiKeyVaultModal';
import { AIAdvisorModal } from './components/AIAdvisorModal';
import { FEATURES } from './config/features';
import { parseStoredKeys, unlockKeys, serializeKeys } from './lib/secureKeys';
import { QuickSearchModal } from './components/QuickSearchModal';
import { IDEConfigExporterModal } from './components/IDEConfigExporterModal';
import { RateLimitMatrixModal } from './components/RateLimitMatrixModal';
import { BookmarksPage } from './components/BookmarksPage';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ExportImportBookmarksModal } from './components/ExportImportBookmarksModal';
import { ParsedBackup, backupFilename, buildBackup } from './lib/backup';
import { downloadTextFile } from './lib/files';
import { applyImport, ImportedBookmark, ImportMode, ImportResult, ImportSource } from './lib/bookmarkTransfer';
import { StartupWelcomeModal } from './components/StartupWelcomeModal';
import { LoadingScreen } from './components/LoadingScreen';
import { INITIAL_AI_TOOLS } from './data/defaultTools';
import { DEFAULT_BOOKMARKS } from './data/defaultBookmarks';
import { AITool, StoredApiKey, ToolBookmark } from './types';
import {
  defaultThemePresets,
  migrateThemeId,
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
const STORAGE_SIDEBAR_COLLAPSED_KEY = 'localmind_sidebar_collapsed_v1';

export default function App() {
  // Navigation view
  const [activeView, setActiveView] = useState<ActiveView>('home');

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  // Theme state
  const [themeId, setThemeId] = useState<string>(() => {
    return migrateThemeId(localStorage.getItem(STORAGE_THEME_KEY));
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

  // Keys are encrypted at rest (see lib/secureKeys.ts). They load locked and unlock on mount.
  const [keys, setKeys] = useState<StoredApiKey[]>(() => {
    try {
      return parseStoredKeys(localStorage.getItem(STORAGE_KEYS_KEY));
    } catch {
      return [];
    }
  });
  const [keyStorageError, setKeyStorageError] = useState<string | null>(null);
  const keyWrites = useRef<Promise<void>>(Promise.resolve());

  /** Save keys encrypted. Writes are queued so the last change always wins. */
  const persistKeys = (next: StoredApiKey[]) => {
    keyWrites.current = keyWrites.current.then(async () => {
      try {
        localStorage.setItem(STORAGE_KEYS_KEY, await serializeKeys(next));
        setKeyStorageError(null);
      } catch (err) {
        setKeyStorageError(
          `Your keys could not be saved securely and will be lost when the app closes. ${
            err instanceof Error ? err.message : ''
          }`.trim()
        );
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    unlockKeys(keys)
      .then(({ keys: unlocked, needsSave }) => {
        if (cancelled) return;
        const byId = new Map(unlocked.map((k) => [k.id, k]));
        setKeys((prev) => prev.map((k) => byId.get(k.id) ?? k));
        if (needsSave) persistKeys(unlocked);
      })
      .catch((err) => {
        if (!cancelled) {
          setKeyStorageError(`Your saved keys could not be unlocked. ${err instanceof Error ? err.message : ''}`.trim());
        }
      });
    return () => {
      cancelled = true;
    };
    // Run once on mount: later changes go through the handlers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorPrompt, setAdvisorPrompt] = useState('');
  const [quickSearchTool, setQuickSearchTool] = useState<AITool | null>(null);
  const [configsTab, setConfigsTab] = useState<'exporter' | 'limits'>('exporter');
  const [configExporterProvider, setConfigExporterProvider] = useState<string | undefined>(undefined);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
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
    imported: ImportedBookmark[],
    mode: ImportMode = 'merge',
    source: ImportSource = 'json',
  ): ImportResult => {
    const result = applyImport(bookmarks, imported, mode, source);
    saveBookmarksToStorage(result.bookmarks);
    return result;
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
    setConfigsTab('exporter');
    setActiveView('configs');
  };

  const handleOpenRateLimitMatrix = () => {
    setConfigsTab('limits');
    setActiveView('configs');
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
        if (isAboutOpen) {
          setIsAboutOpen(false);
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

      // Number keys switch pages in sidebar order
      const NUMBER_VIEWS: Record<string, ActiveView> = {
        '1': 'home',
        '2': 'tools',
        '3': 'bookmarks',
        '4': 'runtimes',
        '5': 'configs',
        '6': 'vault',
        '7': 'settings',
      };
      if (NUMBER_VIEWS[e.key]) {
        e.preventDefault();
        setActiveView(NUMBER_VIEWS[e.key]);
        return;
      }

      // Utility hotkeys
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setActiveView('vault');
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleOpenConfigExporter();
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleOpenRateLimitMatrix();
        return;
      }
      if (FEATURES.advisor && (e.key === 'a' || e.key === 'A')) {
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
    isAboutOpen,
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
      persistKeys(next);
      return next;
    });
  };

  const handleKeyTested = (id: string, status: 'valid' | 'invalid' | 'unknown') => {
    setKeys((prev) => {
      const next = prev.map((k) => (k.id === id ? { ...k, lastTestedStatus: status } : k));
      persistKeys(next);
      return next;
    });
  };

  const handleDeleteKey = (id: string) => {
    setKeys((prev) => {
      const next = prev.filter((k) => k.id !== id);
      persistKeys(next);
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
  const handleExportBackup = (options: { includeKeys: boolean }) => {
    const text = buildBackup(
      {
        customTools: tools.filter((t) => t.isCustom),
        favIds: tools.filter((t) => t.isFavorite).map((t) => t.id),
        keys,
        bookmarks,
        themeId,
        customAccentColor,
        customThemeJson,
        preferences: { defaultLaunchSearch, showScopeExplainer, showStartupScreen, showLoadingAnimation },
      },
      options,
    );
    downloadTextFile(backupFilename(), text, 'application/json');
  };

  // Applies only the sections that are in the (already validated) backup; everything else stays as it is.
  const handleImportBackup = (backup: ParsedBackup) => {
    if (backup.customTools) {
      const favIds = backup.favIds ?? [];
      localStorage.setItem(STORAGE_TOOLS_KEY, JSON.stringify(backup.customTools));
      localStorage.setItem(STORAGE_FAVS_KEY, JSON.stringify(favIds));
      setTools([...INITIAL_AI_TOOLS, ...backup.customTools].map((t) => ({ ...t, isFavorite: favIds.includes(t.id) })));
    }
    if (backup.keys) {
      setKeys(backup.keys);
      persistKeys(backup.keys);
    }
    if (backup.bookmarks) saveBookmarksToStorage(backup.bookmarks);
    if (backup.customThemeJson) {
      setCustomThemeJson(backup.customThemeJson);
      localStorage.setItem(STORAGE_THEMES_JSON_KEY, backup.customThemeJson);
    }
    if (backup.themeId) {
      const migrated = migrateThemeId(backup.themeId);
      setThemeId(migrated);
      localStorage.setItem(STORAGE_THEME_KEY, migrated);
    }
    if (backup.customAccentColor) {
      setCustomAccentColor(backup.customAccentColor);
      localStorage.setItem(STORAGE_ACCENT_KEY, backup.customAccentColor);
    }
    const prefs = backup.preferences;
    if (prefs) {
      if (prefs.defaultLaunchSearch !== undefined) {
        setDefaultLaunchSearch(prefs.defaultLaunchSearch);
        localStorage.setItem(STORAGE_LAUNCH_SEARCH_KEY, String(prefs.defaultLaunchSearch));
      }
      if (prefs.showScopeExplainer !== undefined) {
        setShowScopeExplainer(prefs.showScopeExplainer);
        localStorage.setItem(STORAGE_SCOPE_EXPLAINER_KEY, String(prefs.showScopeExplainer));
      }
      if (prefs.showStartupScreen !== undefined) handleToggleShowStartupScreen(prefs.showStartupScreen);
      if (prefs.showLoadingAnimation !== undefined) handleToggleShowLoadingAnimation(prefs.showLoadingAnimation);
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

  // The Advisor runs on the user's own Gemini key; prefer one that was verified.
  const advisorGeminiKey = useMemo(() => {
    const gemini = keys.filter((k) => k.provider === 'gemini' && k.key);
    return (gemini.find((k) => k.lastTestedStatus === 'valid') || gemini[0])?.key;
  }, [keys]);

  // Open Advisor with optional query
  const handleOpenAdvisor = (initialPrompt?: string) => {
    setAdvisorPrompt(initialPrompt || '');
    setIsAdvisorOpen(true);
  };

  return (
    <div
      className="h-screen overflow-hidden flex flex-col font-sans transition-colors duration-150"
      style={{
        backgroundColor: 'var(--theme-bg)',
        color: 'var(--theme-text)',
      }}
    >
      {/* Left sidebar (labeled, grouped, collapsible) */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleSidebarCollapsed}
        totalTools={tools.length}
        totalBookmarks={bookmarks.length}
        totalKeys={keys.length}
      />

      {/* Title bar */}
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        sidebarCollapsed={sidebarCollapsed}
        themeMode={activeThemePreset.mode === 'dark' ? 'dark' : 'light'}
        onToggleTheme={handleToggleLightDark}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAddBookmarkModal={handleOpenAddBookmarkModal}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenWelcome={() => setIsStartupScreenOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Content area: the only scrolling region, so the scrollbar stays below the title bar */}
      <div
        className="mt-11 pb-16 md:pb-0 flex-1 min-h-0 overflow-y-auto flex flex-col min-w-0 md:ml-[var(--sidebar-w)] transition-[margin] duration-150"
        style={{ ['--sidebar-w' as string]: `${sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH}px` }}
      >
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
              customToolsCount={tools.filter((t) => t.isCustom).length}
              savedKeysCount={keys.length}
              bookmarksCount={bookmarks.length}
              onBackToDashboard={() => setActiveView('home')}
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
        ) : activeView === 'home' ? (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <HomePage
              tools={tools}
              bookmarks={bookmarks}
              keys={keys}
              showScopeExplainer={showScopeExplainer}
              onNavigate={setActiveView}
              onOpenAdvisor={FEATURES.advisor ? handleOpenAdvisor : undefined}
            />
          </main>
        ) : activeView === 'runtimes' ? (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <OmniRouteWidget />
          </main>
        ) : activeView === 'configs' ? (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
            <div
              role="tablist"
              className="flex gap-1 border-b"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              {([
                ['exporter', 'IDE & Agent Config Exporter'],
                ['limits', 'Rate-Limit & Rotation Matrix'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={configsTab === id}
                  onClick={() => setConfigsTab(id)}
                  className="px-3.5 py-2 text-xs font-medium -mb-px border-b-2 cursor-pointer transition-colors"
                  style={{
                    color: configsTab === id ? 'var(--theme-text)' : 'var(--theme-text-secondary)',
                    borderColor: configsTab === id ? 'var(--theme-primary)' : 'transparent',
                    fontWeight: configsTab === id ? 600 : 500,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {configsTab === 'exporter' ? (
              <IDEConfigExporterModal
                inline
                isOpen
                onClose={() => {}}
                savedKeys={keys}
                onSaveKey={handleAddKey}
                initialProvider={configExporterProvider}
              />
            ) : (
              <RateLimitMatrixModal
                inline
                isOpen
                onClose={() => {}}
                onOpenExporterWithProvider={(provId) => handleOpenConfigExporter(provId)}
                savedKeys={keys}
              />
            )}
          </main>
        ) : activeView === 'vault' ? (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ApiKeyVaultModal
              inline
              isOpen
              onClose={() => {}}
              keys={keys}
              onAddKey={handleAddKey}
              onDeleteKey={handleDeleteKey}
              onOpenConfigExporter={(provId) => handleOpenConfigExporter(provId)}
              onKeyTested={handleKeyTested}
              storageError={keyStorageError}
            />
          </main>
        ) : (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ToolsPage
              tools={tools}
              defaultLaunchSearch={defaultLaunchSearch}
              onToggleFavorite={toggleFavorite}
              onDeleteCustom={handleDeleteCustom}
              onLaunchQuickSearch={(t) => setQuickSearchTool(t)}
              onOpenConfigExporter={(provId) => handleOpenConfigExporter(provId)}
              onOpenRateLimitMatrix={handleOpenRateLimitMatrix}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </main>
        )}

        {/* Modals */}
        <AddToolModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddTool={handleAddTool}
        />

        {FEATURES.advisor && (
        <AIAdvisorModal
          isOpen={isAdvisorOpen}
          onClose={() => setIsAdvisorOpen(false)}
          initialPrompt={advisorPrompt}
          geminiKey={advisorGeminiKey}
        />
        )}

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
          onOpenKeyVault={() => setActiveView('vault')}
          onOpenConfigExporter={(provId) => handleOpenConfigExporter(provId)}
          onOpenRateLimitMatrix={handleOpenRateLimitMatrix}
          onOpenAdvisor={FEATURES.advisor ? (prompt) => handleOpenAdvisor(prompt) : undefined}
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
          onOpenKeyVault={() => setActiveView('vault')}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          totalTools={tools.length}
          totalBookmarks={bookmarks.length}
        />

        {/* Animated App Boot Loading Screen */}
        {isLoading && (
          <LoadingScreen
            onFinish={handleLoadingFinish}
            durationMs={1200}
            totalTools={tools.length}
            totalBookmarks={bookmarks.length}
          />
        )}

        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      </div>

      {/* Advisor: a floating action rather than a sidebar page (hidden by FEATURES.advisor) */}
      {FEATURES.advisor && (
      <button
        id="btn-open-advisor"
        onClick={() => handleOpenAdvisor()}
        title="Ask the AI Architecture Advisor (A)"
        className="fixed right-5 bottom-20 md:bottom-5 z-30 px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
        style={{
          backgroundColor: 'var(--theme-primary)',
          color: 'var(--theme-primary-foreground, #000000)',
        }}
      >
        <Sparkles className="w-4 h-4" />
        Ask Advisor
      </button>
      )}
    </div>
  );
}
