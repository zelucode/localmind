import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./backend', () => ({ fetchFeed: vi.fn() }));

import { fetchFeed } from './backend';
import { PROVIDERS, deriveRateLimits, derivePresets, deriveVaultProviders } from '../data/providers';
import {
  REFRESH_INTERVAL_MS,
  STORAGE_FEED_CACHE_KEY,
  activeProviders,
  isFeedStale,
  loadFeedCache,
  loadFeedSettings,
  mergeProviders,
  parseProviderRow,
  parseProvidersFeed,
  pullProvidersFeed,
  saveFeedCache,
  saveFeedSettings,
  type FeedCache,
} from './feed';

const groq = () => structuredClone(PROVIDERS.find((p) => p.id === 'groq')!);
const feedText = (providers: unknown[], extra: Record<string, unknown> = {}) =>
  JSON.stringify({ schema: 1, updated: '2026-10-07', providers, ...extra });

const mocked = vi.mocked(fetchFeed);
beforeEach(() => {
  mocked.mockReset();
});

describe('parseProviderRow', () => {
  it('accepts every built-in row (the feed format is the built-in format)', () => {
    for (const p of PROVIDERS) {
      const r = parseProviderRow(JSON.parse(JSON.stringify(p)));
      expect('provider' in r, 'error' in r ? `${p.id}: ${r.error}` : p.id).toBe(true);
    }
  });

  it('rejects unsafe or malformed fields', () => {
    const bad = (mut: (p: Record<string, any>) => void) => {
      const row = JSON.parse(JSON.stringify(groq()));
      mut(row);
      return 'error' in parseProviderRow(row);
    };
    expect(bad((p) => (p.id = 'Bad Id'))).toBe(true);
    expect(bad((p) => (p.getKeyUrl = 'javascript:alert(1)'))).toBe(true);
    expect(bad((p) => (p.docsUrl = 'file:///etc/passwd'))).toBe(true);
    expect(bad((p) => (p.isFree = 'yes'))).toBe(true);
    expect(bad((p) => (p.reviewed = '2026-13'))).toBe(true);
    expect(bad((p) => (p.status = 'gone'))).toBe(true);
    expect(bad((p) => (p.limits.speed = 'Warp'))).toBe(true);
    expect(bad((p) => (p.name = 'x'.repeat(200)))).toBe(true);
  });

  it('rejects values that could inject shell commands into a generated config', () => {
    const bad = (mut: (p: Record<string, any>) => void) => {
      const row = JSON.parse(JSON.stringify(groq()));
      mut(row);
      return 'error' in parseProviderRow(row);
    };
    expect(bad((p) => (p.api.defaultModel = 'x"; rm -rf ~; "'))).toBe(true);
    expect(bad((p) => (p.api.availableModels[0].id = 'a b'))).toBe(true);
    expect(bad((p) => (p.api.baseUrl = 'https://x.com/v1" --evil'))).toBe(true);
    expect(bad((p) => (p.api.baseUrl = 'https://x.com/$(id)'))).toBe(true);
    expect(bad((p) => (p.api.envVarName = 'KEY; echo'))).toBe(true);
    expect(bad((p) => (p.api.envVarName = 'lower'))).toBe(true);
  });

  it('requires the default model to be in the model list', () => {
    const row = JSON.parse(JSON.stringify(groq()));
    row.api.defaultModel = 'not-listed';
    expect('error' in parseProviderRow(row)).toBe(true);
  });

  it('does not let the feed add a Key Vault provider the app cannot verify', () => {
    const row = { ...JSON.parse(JSON.stringify(groq())), id: 'newcloud', inVault: true };
    expect('error' in parseProviderRow(row)).toBe(true);
    expect('provider' in parseProviderRow({ ...row, inVault: false })).toBe(true);
  });
});

describe('parseProvidersFeed', () => {
  it('reads a valid feed', () => {
    const r = parseProvidersFeed(feedText([groq()]));
    expect('error' in r).toBe(false);
    if ('error' in r) return;
    expect(r.providers).toHaveLength(1);
    expect(r.updated).toBe('2026-10-07');
    expect(r.skipped).toEqual([]);
  });

  it('rejects whole-file problems with a readable message', () => {
    expect(parseProvidersFeed('<html>')).toEqual({ error: 'The feed is not valid JSON.' });
    expect(parseProvidersFeed('[]')).toMatchObject({ error: expect.stringContaining('JSON object') });
    expect(parseProvidersFeed(JSON.stringify({ schema: 2, providers: [] }))).toMatchObject({ error: expect.stringContaining('version') });
    expect(parseProvidersFeed(JSON.stringify({ schema: 1 }))).toMatchObject({ error: expect.stringContaining('providers') });
    expect(parseProvidersFeed(feedText([]))).toMatchObject({ error: expect.stringContaining('no usable') });
    expect(parseProvidersFeed(feedText(Array(201).fill(groq())))).toMatchObject({ error: expect.stringContaining('more than') });
  });

  it('skips bad and duplicate rows, keeps good ones, and says what was skipped', () => {
    const r = parseProvidersFeed(feedText([groq(), { id: 'broken' }, groq(), 5]));
    if ('error' in r) throw new Error(r.error);
    expect(r.providers).toHaveLength(1);
    expect(r.skipped).toHaveLength(3);
    expect(r.skipped.join(' ')).toMatch(/duplicate/);
  });

  it('ignores a malformed updated date instead of trusting it', () => {
    const r = parseProvidersFeed(feedText([groq()], { updated: 'yesterday' }));
    if ('error' in r) throw new Error(r.error);
    expect(r.updated).toBeNull();
  });
});

describe('mergeProviders and the derived views', () => {
  it('replaces a built-in row by id and appends new ids', () => {
    const changed = { ...groq(), freeQuota: 'NEW QUOTA TEXT' };
    const added = { ...groq(), id: 'newcloud', name: 'New Cloud', inVault: false };
    const merged = mergeProviders(PROVIDERS, [changed, added]);
    expect(merged).toHaveLength(PROVIDERS.length + 1);
    expect(merged.find((p) => p.id === 'groq')!.freeQuota).toBe('NEW QUOTA TEXT');
    expect(merged[merged.length - 1].id).toBe('newcloud');
    expect(merged.map((p) => p.id).slice(0, PROVIDERS.length)).toEqual(PROVIDERS.map((p) => p.id));
  });

  it('shows a retired provider in the matrix as retired, but not in the exporter or the vault', () => {
    const retired = { ...groq(), status: 'retired' as const };
    const merged = mergeProviders(PROVIDERS, [retired]);
    expect(deriveRateLimits(merged).find((r) => r.id === 'groq')!.retired).toBe(true);
    expect(derivePresets(merged).some((p) => p.id === 'groq')).toBe(false);
    expect(deriveVaultProviders(merged).some((p) => p.provider === 'groq')).toBe(false);
    expect(deriveRateLimits(PROVIDERS).every((r) => !r.retired)).toBe(true);
  });
});

describe('staleness', () => {
  const cache = (over: Partial<FeedCache> = {}): FeedCache => ({
    fetchedAt: 1_000_000,
    url: 'https://x.test/f.json',
    updated: null,
    providers: [groq()],
    skipped: [],
    ...over,
  });

  it('is stale with no cache, a different address, a day-old cache, or a clock that went backwards', () => {
    const now = 1_000_000 + 1000;
    expect(isFeedStale(null, 'https://x.test/f.json', now)).toBe(true);
    expect(isFeedStale(cache(), 'https://other.test/f.json', now)).toBe(true);
    expect(isFeedStale(cache(), 'https://x.test/f.json', 1_000_000 + REFRESH_INTERVAL_MS)).toBe(true);
    expect(isFeedStale(cache({ fetchedAt: now + 5000 }), 'https://x.test/f.json', now)).toBe(true);
  });

  it('is fresh inside the refresh interval for the same address', () => {
    expect(isFeedStale(cache(), 'https://x.test/f.json', 1_000_000 + REFRESH_INTERVAL_MS - 1)).toBe(false);
  });
});

describe('pullProvidersFeed', () => {
  it('returns a cache entry for a valid download', async () => {
    mocked.mockResolvedValue(feedText([groq()]));
    const r = await pullProvidersFeed('  https://x.test/f.json ', 42);
    if ('error' in r) throw new Error(r.error);
    expect(mocked).toHaveBeenCalledWith('https://x.test/f.json');
    expect(r.cache).toMatchObject({ fetchedAt: 42, url: 'https://x.test/f.json', updated: '2026-10-07' });
  });

  it('turns a download failure into an error and never throws', async () => {
    mocked.mockImplementation(async () => {
      throw new Error('Could not reach the feed server.');
    });
    expect(await pullProvidersFeed('https://x.test/f.json')).toEqual({ error: 'Could not reach the feed server.' });
  });

  it('turns an invalid feed into an error', async () => {
    mocked.mockResolvedValue('{"schema":1,"providers":[{"id":"x"}]}');
    expect('error' in (await pullProvidersFeed('https://x.test/f.json'))).toBe(true);
  });

  it('does not call the backend without an address', async () => {
    expect(await pullProvidersFeed('   ')).toEqual({ error: 'No feed address is set.' });
    expect(mocked).not.toHaveBeenCalled();
  });
});

describe('settings, cache and activeProviders', () => {
  afterEach(() => localStorage.clear());

  it('round-trips settings and falls back to defaults on garbage', () => {
    expect(loadFeedSettings()).toEqual({ enabled: true, url: '' });
    saveFeedSettings({ enabled: false, url: 'https://x.test/f.json' });
    expect(loadFeedSettings()).toEqual({ enabled: false, url: 'https://x.test/f.json' });
    localStorage.setItem('localmind_feed_settings_v1', '{oops');
    expect(loadFeedSettings()).toEqual({ enabled: true, url: '' });
  });

  it('re-validates the cache on read, so a tampered row cannot reach the UI', () => {
    const good = groq();
    const evil = { ...groq(), id: 'evil', api: { ...groq().api, baseUrl: 'https://x.com/"; rm -rf ~' } };
    localStorage.setItem(
      STORAGE_FEED_CACHE_KEY,
      JSON.stringify({ fetchedAt: 1, url: 'https://x.test/f.json', updated: null, providers: [good, evil], skipped: [] }),
    );
    expect(loadFeedCache()!.providers.map((p) => p.id)).toEqual(['groq']);
    localStorage.setItem(STORAGE_FEED_CACHE_KEY, 'nope');
    expect(loadFeedCache()).toBeNull();
  });

  it('uses the built-in data unless the feed is enabled and cached for the current address', () => {
    const cache: FeedCache = { fetchedAt: 1, url: 'https://x.test/f.json', updated: null, providers: [{ ...groq(), freeQuota: 'LIVE' }], skipped: [] };
    saveFeedCache(cache);
    const on = { enabled: true, url: 'https://x.test/f.json' };
    expect(activeProviders(on, cache).find((p) => p.id === 'groq')!.freeQuota).toBe('LIVE');
    expect(activeProviders({ ...on, enabled: false }, cache)).toBe(PROVIDERS);
    expect(activeProviders({ ...on, url: 'https://other.test/f.json' }, cache)).toBe(PROVIDERS);
    expect(activeProviders(on, null)).toBe(PROVIDERS);
  });
});

describe('feed/providers.json (the file to publish)', () => {
  const file = readFileSync(resolve(process.cwd(), 'feed/providers.json'), 'utf8');

  it('is valid for this app version, with no skipped rows', () => {
    const r = parseProvidersFeed(file);
    if ('error' in r) throw new Error(r.error);
    expect(r.skipped).toEqual([]);
  });

  it('matches the built-in data (run "pnpm feed:build" after editing src/data/providers.ts)', () => {
    expect(JSON.parse(file).providers).toEqual(JSON.parse(JSON.stringify(PROVIDERS)));
  });
});
