import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  PROVIDERS,
  PROVIDER_PRESETS,
  POPULAR_API_PROVIDERS,
  RATE_LIMIT_DATA,
  deriveRateLimits,
  derivePresets,
  deriveVaultProviders,
  type ProviderPreset,
  type RateLimitItem,
  type VaultProvider,
} from '../data/providers';
import {
  DEFAULT_FEED_SETTINGS,
  activeProviders,
  clearFeedCache,
  isFeedStale,
  loadFeedCache,
  loadFeedSettings,
  pullProvidersFeed,
  saveFeedCache,
  saveFeedSettings,
  type FeedSettings,
} from './feed';
import { logWarn } from './errorLog';

/** How often a running app checks whether the cached feed has gone stale. */
const STALE_CHECK_MS = 60 * 60 * 1000;

export interface FeedState {
  /** False when no provider is mounted (tests, crash screen): the built-in data is shown and nothing is fetched. */
  available: boolean;
  settings: FeedSettings;
  /** The feed's own "updated" date, if it gave one. */
  updated: string | null;
  /** Epoch ms of the last successful download that is in use. */
  fetchedAt: number | null;
  /** True while the cached feed is what is being shown. */
  inUse: boolean;
  refreshing: boolean;
  /** The last download or validation problem. Cleared by the next success. */
  error: string | null;
  /** Rows in the feed that were left out because they failed validation. */
  skipped: string[];
}

export interface ProviderData {
  vaultProviders: VaultProvider[];
  rateLimits: RateLimitItem[];
  presets: ProviderPreset[];
  feed: FeedState;
  refresh: () => Promise<void>;
  updateSettings: (next: FeedSettings) => void;
}

const DEFAULT_VALUE: ProviderData = {
  vaultProviders: POPULAR_API_PROVIDERS,
  rateLimits: RATE_LIMIT_DATA,
  presets: PROVIDER_PRESETS,
  feed: {
    available: false,
    settings: DEFAULT_FEED_SETTINGS,
    updated: null,
    fetchedAt: null,
    inUse: false,
    refreshing: false,
    error: null,
    skipped: [],
  },
  refresh: async () => {},
  updateSettings: () => {},
};

const ProviderDataContext = createContext<ProviderData>(DEFAULT_VALUE);

export function useProviderData(): ProviderData {
  return useContext(ProviderDataContext);
}

export const ProviderDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<FeedSettings>(loadFeedSettings);
  const [cache, setCache] = useState(loadFeedCache);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRun = useRef(0);

  const url = settings.url.trim();
  const canFetch = settings.enabled && url !== '';

  const refresh = useCallback(async () => {
    if (!canFetch) return;
    const run = ++latestRun.current;
    setRefreshing(true);
    const result = await pullProvidersFeed(url);
    if (run !== latestRun.current) return; // a newer refresh or a settings change took over
    setRefreshing(false);
    if ('error' in result) {
      logWarn('feed', `Live data update failed: ${result.error}`);
      setError(result.error); // the previous cache stays in use
      return;
    }
    saveFeedCache(result.cache);
    setCache(result.cache);
    setError(null);
  }, [canFetch, url]);

  // Refresh when the app opens (or the address changes) if the cache is old, and re-check while it stays open.
  useEffect(() => {
    if (!canFetch) return;
    const check = () => {
      if (isFeedStale(loadFeedCache(), url, Date.now())) void refresh();
    };
    check();
    const timer = setInterval(check, STALE_CHECK_MS);
    return () => clearInterval(timer);
  }, [canFetch, url, refresh]);

  const updateSettings = useCallback((next: FeedSettings) => {
    const cleaned = { enabled: next.enabled, url: next.url.trim() };
    latestRun.current++; // drop any download still in flight for the old address
    setRefreshing(false);
    setError(null);
    setSettings(cleaned);
    saveFeedSettings(cleaned);
    if (!cleaned.enabled || cleaned.url === '') {
      clearFeedCache();
      setCache(null);
    }
  }, []);

  const value = useMemo<ProviderData>(() => {
    const providers = activeProviders(settings, cache);
    const inUse = providers !== PROVIDERS;
    return {
      vaultProviders: deriveVaultProviders(providers),
      rateLimits: deriveRateLimits(providers),
      presets: derivePresets(providers),
      feed: {
        available: true,
        settings,
        updated: inUse ? cache!.updated : null,
        fetchedAt: inUse ? cache!.fetchedAt : null,
        inUse,
        refreshing,
        error,
        skipped: inUse ? cache!.skipped : [],
      },
      refresh,
      updateSettings,
    };
  }, [settings, cache, refreshing, error, refresh, updateSettings]);

  return <ProviderDataContext.Provider value={value}>{children}</ProviderDataContext.Provider>;
};
