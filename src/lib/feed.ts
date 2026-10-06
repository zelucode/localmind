/**
 * Remote data feed: provider facts (quotas, free or not, retired) pulled from a public JSON file so
 * they can be corrected without shipping a new app version.
 *
 * Rules: the built-in data in `src/data/providers.ts` is always the fallback; a feed is only ever
 * used after it passes `parseProvidersFeed`; a failed or invalid pull never replaces good data.
 *
 * Feed values end up in copy-paste shell commands (Config Exporter), so anything that could carry
 * shell syntax (model ids, URLs, env var names) is validated strictly here, not just displayed.
 */
import { PROVIDERS, VAULT_PROVIDER_IDS, type ProviderApi, type ProviderInfo, type ProviderLimits } from '../data/providers';
import { fetchFeed } from './backend';
import { safeHttpUrl } from './bookmarkTransfer';

export const FEED_SCHEMA_VERSION = 1;
export const MAX_FEED_ROWS = 200;

/** Where the built-in "official" feed lives. Empty until the feed repo is published; the user can set their own in Settings. */
export const DEFAULT_FEED_URL = '';

/** A feed is refreshed on its own at most this often. */
export const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const STORAGE_FEED_SETTINGS_KEY = 'localmind_feed_settings_v1';
export const STORAGE_FEED_CACHE_KEY = 'localmind_feed_cache_v1';

// ---- Validation ----

const ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
/** Model ids as providers write them: letters, digits and . _ : / @ + - only. No spaces, quotes or shell characters. */
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,99}$/;
const ENV_VAR = /^[A-Z][A-Z0-9_]{0,63}$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const SPEEDS = ['Ultra Fast (<200ms)', 'Fast (1-2s)', 'Standard (2-4s)', 'Local Hardware'] as const;
const CATEGORIES = ['cloud-api', 'router', 'local'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

function text(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length > 0 && s.length <= max ? s : null;
}

/** A link that is safe to open and to paste into a shell command. */
function cleanUrl(v: unknown): string | null {
  const url = safeHttpUrl(v);
  if (!url || url.length > 300 || /[\s"'`$\\<>^|;&(){}]/.test(url)) return null;
  return url;
}

function rateValue(v: unknown): number | string | null {
  if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v;
  return text(v, 80);
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

function parseLimits(raw: unknown): ProviderLimits | null {
  if (!isObj(raw)) return null;
  const bestModel = text(raw.bestModel, 100);
  const rpm = rateValue(raw.rpm);
  const rpd = rateValue(raw.rpd);
  const tpm = text(raw.tpm, 80);
  const contextWindow = text(raw.contextWindow, 80);
  const renewalCycle = text(raw.renewalCycle, 120);
  const role = text(raw.role, 160);
  const speed = oneOf(raw.speed, SPEEDS);
  const category = oneOf(raw.category, CATEGORIES);
  if (typeof raw.creditCardRequired !== 'boolean') return null;
  if (!bestModel || rpm === null || rpd === null || !tpm || !contextWindow || !renewalCycle || !role || !speed || !category) {
    return null;
  }
  return { bestModel, rpm, rpd, tpm, contextWindow, creditCardRequired: raw.creditCardRequired, renewalCycle, role, speed, category };
}

function parseApi(raw: unknown): ProviderApi | null {
  if (!isObj(raw)) return null;
  const defaultModel = typeof raw.defaultModel === 'string' && MODEL_ID.test(raw.defaultModel) ? raw.defaultModel : null;
  const baseUrl = cleanUrl(raw.baseUrl);
  const envVarName = typeof raw.envVarName === 'string' && ENV_VAR.test(raw.envVarName) ? raw.envVarName : null;
  const freeTierTag = text(raw.freeTierTag, 120);
  if (!defaultModel || !baseUrl || !envVarName || !freeTierTag) return null;
  if (!Array.isArray(raw.availableModels) || raw.availableModels.length === 0 || raw.availableModels.length > 30) return null;
  const availableModels: ProviderApi['availableModels'] = [];
  for (const m of raw.availableModels) {
    if (!isObj(m)) return null;
    const id = typeof m.id === 'string' && MODEL_ID.test(m.id) ? m.id : null;
    const name = text(m.name, 100);
    const notes = typeof m.notes === 'string' && m.notes.length <= 200 ? m.notes : null;
    if (!id || !name || notes === null) return null;
    availableModels.push({ id, name, notes });
  }
  if (!availableModels.some((m) => m.id === defaultModel)) return null;
  return { defaultModel, availableModels, baseUrl, envVarName, freeTierTag };
}

/** One provider row, or the reason it was not accepted. */
export function parseProviderRow(raw: unknown): { provider: ProviderInfo } | { error: string } {
  if (!isObj(raw)) return { error: 'not an object' };
  const id = typeof raw.id === 'string' && ID.test(raw.id) ? raw.id : null;
  if (!id) return { error: 'missing or invalid id' };
  const bad = (why: string) => ({ error: `${id}: ${why}` });

  const name = text(raw.name, 80);
  const freeQuota = text(raw.freeQuota, 500);
  const setupGuide = text(raw.setupGuide, 500);
  const getKeyUrl = cleanUrl(raw.getKeyUrl);
  const docsUrl = cleanUrl(raw.docsUrl);
  if (!name) return bad('name');
  if (!freeQuota) return bad('freeQuota');
  if (!setupGuide) return bad('setupGuide');
  if (!getKeyUrl) return bad('getKeyUrl');
  if (!docsUrl) return bad('docsUrl');
  if (typeof raw.isFree !== 'boolean') return bad('isFree');
  if (typeof raw.inVault !== 'boolean') return bad('inVault');
  if (raw.inVault && !(VAULT_PROVIDER_IDS as readonly string[]).includes(id)) return bad('the Key Vault does not support this provider');

  const provider: ProviderInfo = { id, name, getKeyUrl, docsUrl, isFree: raw.isFree, freeQuota, setupGuide, inVault: raw.inVault };

  if (raw.reviewed !== undefined) {
    if (typeof raw.reviewed !== 'string' || !MONTH.test(raw.reviewed)) return bad('reviewed must be YYYY-MM');
    provider.reviewed = raw.reviewed;
  }
  if (raw.status !== undefined) {
    const status = oneOf(raw.status, ['active', 'retired'] as const);
    if (!status) return bad('status');
    provider.status = status;
  }
  if (raw.limits !== undefined) {
    const limits = parseLimits(raw.limits);
    if (!limits) return bad('limits');
    provider.limits = limits;
  }
  if (raw.api !== undefined) {
    const api = parseApi(raw.api);
    if (!api) return bad('api');
    provider.api = api;
  }
  return { provider };
}

export interface ProvidersFeed {
  providers: ProviderInfo[];
  /** 'YYYY-MM-DD' the publisher gave the file, if any. */
  updated: string | null;
  /** One line per row that was left out, so a partly bad feed is still usable and still explained. */
  skipped: string[];
}

/** Validate feed text. Bad rows are skipped and reported; a feed with no usable row is rejected. */
export function parseProvidersFeed(content: string): ProvidersFeed | { error: string } {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return { error: 'The feed is not valid JSON.' };
  }
  if (!isObj(data)) return { error: 'The feed must be a JSON object.' };
  if (data.schema !== FEED_SCHEMA_VERSION) {
    return { error: `Unsupported feed version (${String(data.schema)}). This app reads version ${FEED_SCHEMA_VERSION}.` };
  }
  if (!Array.isArray(data.providers)) return { error: 'The feed has no "providers" list.' };
  if (data.providers.length > MAX_FEED_ROWS) return { error: `The feed has more than ${MAX_FEED_ROWS} providers.` };

  const providers: ProviderInfo[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  data.providers.forEach((row, i) => {
    const result = parseProviderRow(row);
    if ('error' in result) {
      skipped.push(`Row ${i + 1} (${result.error})`);
    } else if (seen.has(result.provider.id)) {
      skipped.push(`Row ${i + 1} (${result.provider.id}: duplicate id)`);
    } else {
      seen.add(result.provider.id);
      providers.push(result.provider);
    }
  });
  if (providers.length === 0) return { error: 'The feed had no usable providers.' };

  const updated = typeof data.updated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.updated) ? data.updated : null;
  return { providers, updated, skipped };
}

// ---- Merge ----

/** Built-in rows, with feed rows replacing the same id and new ids added at the end. */
export function mergeProviders(builtin: ProviderInfo[], feed: ProviderInfo[]): ProviderInfo[] {
  const byId = new Map(feed.map((p) => [p.id, p]));
  const merged = builtin.map((p) => byId.get(p.id) ?? p);
  const known = new Set(builtin.map((p) => p.id));
  return merged.concat(feed.filter((p) => !known.has(p.id)));
}

// ---- Settings and cache (localStorage; the feed is public data, nothing secret) ----

export interface FeedSettings {
  enabled: boolean;
  url: string;
}

export const DEFAULT_FEED_SETTINGS: FeedSettings = { enabled: true, url: DEFAULT_FEED_URL };

/** What was last downloaded and accepted. */
export interface FeedCache {
  /** Epoch ms of the download. */
  fetchedAt: number;
  /** The address it came from, so a changed address does not reuse another feed's data. */
  url: string;
  updated: string | null;
  providers: ProviderInfo[];
  skipped: string[];
}

export function loadFeedSettings(): FeedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_FEED_SETTINGS_KEY);
    if (!raw) return DEFAULT_FEED_SETTINGS;
    const v = JSON.parse(raw);
    return {
      enabled: typeof v?.enabled === 'boolean' ? v.enabled : DEFAULT_FEED_SETTINGS.enabled,
      url: typeof v?.url === 'string' ? v.url : DEFAULT_FEED_SETTINGS.url,
    };
  } catch {
    return DEFAULT_FEED_SETTINGS;
  }
}

export function saveFeedSettings(settings: FeedSettings): void {
  try {
    localStorage.setItem(STORAGE_FEED_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable: the setting just won't persist
  }
}

/** The cached feed, re-validated on every read so a damaged or hand-edited cache cannot reach the UI. */
export function loadFeedCache(): FeedCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_FEED_CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!isObj(v) || typeof v.fetchedAt !== 'number' || typeof v.url !== 'string' || !Array.isArray(v.providers)) return null;
    const providers: ProviderInfo[] = [];
    for (const row of v.providers) {
      const r = parseProviderRow(row);
      if ('provider' in r) providers.push(r.provider);
    }
    if (providers.length === 0) return null;
    return {
      fetchedAt: v.fetchedAt,
      url: v.url,
      updated: typeof v.updated === 'string' ? v.updated : null,
      providers,
      skipped: Array.isArray(v.skipped) ? v.skipped.filter((s: unknown): s is string => typeof s === 'string') : [],
    };
  } catch {
    return null;
  }
}

export function saveFeedCache(cache: FeedCache): void {
  try {
    localStorage.setItem(STORAGE_FEED_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage unavailable or full: the feed still works for this session
  }
}

export function clearFeedCache(): void {
  try {
    localStorage.removeItem(STORAGE_FEED_CACHE_KEY);
  } catch {
    // nothing to clear
  }
}

/** True when there is nothing cached for this address yet, or the cache is older than the refresh interval. */
export function isFeedStale(cache: FeedCache | null, url: string, now: number): boolean {
  if (!cache || cache.url !== url) return true;
  return now - cache.fetchedAt >= REFRESH_INTERVAL_MS || cache.fetchedAt > now;
}

// ---- Fetch ----

export type FeedFetchResult = { cache: FeedCache } | { error: string };

/** Download, validate and return a new cache entry. Never throws; an error leaves the old cache alone. */
export async function pullProvidersFeed(url: string, now: number = Date.now()): Promise<FeedFetchResult> {
  const address = url.trim();
  if (!address) return { error: 'No feed address is set.' };
  let content: string;
  try {
    content = await fetchFeed(address);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'The feed could not be downloaded.' };
  }
  const parsed = parseProvidersFeed(content);
  if ('error' in parsed) return { error: parsed.error };
  return { cache: { fetchedAt: now, url: address, updated: parsed.updated, providers: parsed.providers, skipped: parsed.skipped } };
}

/** Rows to use right now: built-in data, plus the cached feed when it is enabled and belongs to the current address. */
export function activeProviders(settings: FeedSettings, cache: FeedCache | null): ProviderInfo[] {
  if (!settings.enabled || !cache || cache.url !== settings.url.trim()) return PROVIDERS;
  return mergeProviders(PROVIDERS, cache.providers);
}
