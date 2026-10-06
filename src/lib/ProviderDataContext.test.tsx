import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./backend', () => ({ fetchFeed: vi.fn() }));

import { fetchFeed } from './backend';
import { PROVIDERS } from '../data/providers';
import { ProviderDataProvider, useProviderData } from './ProviderDataContext';
import { FeedSettingsPanel, FeedStatus } from '../components/FeedStatus';
import { STORAGE_FEED_CACHE_KEY, STORAGE_FEED_SETTINGS_KEY } from './feed';

const mocked = vi.mocked(fetchFeed);
const URL_ = 'https://x.test/providers.json';

const groq = () => structuredClone(PROVIDERS.find((p) => p.id === 'groq')!);
const feed = (quota: string, extra: object = {}) =>
  JSON.stringify({ schema: 1, updated: '2026-10-07', providers: [{ ...groq(), freeQuota: quota, ...extra }] });

function Probe() {
  const { vaultProviders, rateLimits } = useProviderData();
  return (
    <div>
      <span data-testid="vault-groq">{vaultProviders.find((p) => p.provider === 'groq')?.freeQuota ?? 'none'}</span>
      <span data-testid="matrix-groq">{rateLimits.find((r) => r.id === 'groq')?.retired ? 'retired' : 'active'}</span>
      <FeedStatus />
    </div>
  );
}

const mount = () =>
  render(
    <ProviderDataProvider>
      <Probe />
    </ProviderDataProvider>,
  );

const setSettings = (s: object) => localStorage.setItem(STORAGE_FEED_SETTINGS_KEY, JSON.stringify(s));
const setCache = (fetchedAt: number, quota = 'CACHED') =>
  localStorage.setItem(
    STORAGE_FEED_CACHE_KEY,
    JSON.stringify({ fetchedAt, url: URL_, updated: '2026-10-01', providers: [{ ...groq(), freeQuota: quota }], skipped: [] }),
  );

beforeEach(() => {
  mocked.mockReset();
});

describe('ProviderDataProvider', () => {
  it('shows the built-in data and fetches nothing when no feed address is set', () => {
    mount();
    expect(screen.getByTestId('vault-groq')).toHaveTextContent(PROVIDERS.find((p) => p.id === 'groq')!.freeQuota);
    expect(mocked).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /refresh data/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Live updates are off or not set up/)).toBeInTheDocument();
  });

  it('downloads on open when there is no cache, then shows the live data', async () => {
    setSettings({ enabled: true, url: URL_ });
    mocked.mockResolvedValue(feed('LIVE QUOTA'));
    mount();
    await waitFor(() => expect(screen.getByTestId('vault-groq')).toHaveTextContent('LIVE QUOTA'));
    expect(screen.getByText(/Live data from 2026-10-07/)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_FEED_CACHE_KEY)).toContain('LIVE QUOTA');
  });

  it('uses a fresh cache without downloading', () => {
    setSettings({ enabled: true, url: URL_ });
    setCache(Date.now() - 1000);
    mount();
    expect(screen.getByTestId('vault-groq')).toHaveTextContent('CACHED');
    expect(mocked).not.toHaveBeenCalled();
  });

  it('shows the cache immediately and refreshes it in the background when it is a day old', async () => {
    setSettings({ enabled: true, url: URL_ });
    setCache(Date.now() - 25 * 60 * 60 * 1000);
    mocked.mockResolvedValue(feed('NEWER'));
    mount();
    expect(screen.getByTestId('vault-groq')).toHaveTextContent('CACHED');
    await waitFor(() => expect(screen.getByTestId('vault-groq')).toHaveTextContent('NEWER'));
  });

  it('keeps the last good data and says so when a refresh fails', async () => {
    setSettings({ enabled: true, url: URL_ });
    setCache(Date.now() - 1000);
    mocked.mockImplementation(async () => {
      throw new Error('Could not reach the feed server.');
    });
    mount();
    await userEvent.click(screen.getByRole('button', { name: /refresh data/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not reach the feed server.*last good download/);
    expect(screen.getByTestId('vault-groq')).toHaveTextContent('CACHED');
  });

  it('keeps the built-in data when the feed is invalid', async () => {
    setSettings({ enabled: true, url: URL_ });
    mocked.mockResolvedValue('<html>not json</html>');
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent(/not valid JSON.*built-in data/);
    expect(screen.getByTestId('vault-groq')).toHaveTextContent(PROVIDERS.find((p) => p.id === 'groq')!.freeQuota);
    expect(localStorage.getItem(STORAGE_FEED_CACHE_KEY)).toBeNull();
  });

  it('the Refresh button downloads again and shows the new data', async () => {
    setSettings({ enabled: true, url: URL_ });
    setCache(Date.now() - 1000);
    mocked.mockResolvedValue(feed('AFTER REFRESH'));
    mount();
    await userEvent.click(screen.getByRole('button', { name: /refresh data/i }));
    await waitFor(() => expect(screen.getByTestId('vault-groq')).toHaveTextContent('AFTER REFRESH'));
    expect(mocked).toHaveBeenCalledTimes(1);
  });

  it('marks a provider the feed retired', async () => {
    setSettings({ enabled: true, url: URL_ });
    mocked.mockResolvedValue(feed('x', { status: 'retired' }));
    mount();
    await waitFor(() => expect(screen.getByTestId('matrix-groq')).toHaveTextContent('retired'));
    expect(screen.getByTestId('vault-groq')).toHaveTextContent('none');
  });

  it('ignores a cache from another address and a disabled feed', () => {
    setSettings({ enabled: false, url: URL_ });
    setCache(Date.now() - 1000);
    mount();
    expect(screen.getByTestId('vault-groq')).toHaveTextContent(PROVIDERS.find((p) => p.id === 'groq')!.freeQuota);
    expect(mocked).not.toHaveBeenCalled();
  });

  it('reports rows it had to ignore', async () => {
    setSettings({ enabled: true, url: URL_ });
    mocked.mockResolvedValue(
      JSON.stringify({ schema: 1, providers: [groq(), { id: 'broken' }] }),
    );
    mount();
    expect(await screen.findByText(/1 feed row ignored/)).toBeInTheDocument();
  });
});

describe('FeedSettingsPanel', () => {
  const mountPanel = () =>
    render(
      <ProviderDataProvider>
        <FeedSettingsPanel />
      </ProviderDataProvider>,
    );

  it('refuses a feed address that is not https', async () => {
    mountPanel();
    await userEvent.type(screen.getByLabelText('Feed address'), 'http://example.com/f.json');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/https/);
    expect(localStorage.getItem(STORAGE_FEED_SETTINGS_KEY)).toBeNull();
  });

  it('saves an https address, downloads it, and clears the cache when switched off', async () => {
    mocked.mockResolvedValue(feed('LIVE'));
    mountPanel();
    await userEvent.type(screen.getByLabelText('Feed address'), URL_);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved.');
    expect(JSON.parse(localStorage.getItem(STORAGE_FEED_SETTINGS_KEY)!)).toEqual({ enabled: true, url: URL_ });
    await waitFor(() => expect(localStorage.getItem(STORAGE_FEED_CACHE_KEY)).toContain('LIVE'));

    await userEvent.click(screen.getByLabelText('Use live provider data'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(localStorage.getItem(STORAGE_FEED_CACHE_KEY)).toBeNull();
  });
});
