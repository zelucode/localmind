import React, { useEffect, useState } from 'react';
import { RefreshCw, CloudDownload } from 'lucide-react';
import { useProviderData } from '../lib/ProviderDataContext';
import { toWebUrl } from '../lib/url';

/** One line about where the provider data comes from, with a Refresh button when a feed is set. */
export const FeedStatus: React.FC = () => {
  const { feed, refresh } = useProviderData();
  const hasFeed = feed.available && feed.settings.enabled && feed.settings.url !== '';

  let source: string;
  if (feed.inUse && feed.fetchedAt !== null) {
    source = `Live data${feed.updated ? ` from ${feed.updated}` : ''}, downloaded ${new Date(feed.fetchedAt).toLocaleString()}.`;
  } else if (hasFeed) {
    source = 'Built-in data (no live update downloaded yet).';
  } else {
    source = 'Built-in data. Live updates are off or not set up (Settings > Data & Backups).';
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
      <span>{source}</span>
      {hasFeed && (
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={feed.refreshing}
          className="px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 cursor-pointer hover:opacity-85 disabled:opacity-50"
          style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
        >
          <RefreshCw className={`w-3 h-3 ${feed.refreshing ? 'animate-spin' : ''}`} />
          {feed.refreshing ? 'Refreshing...' : 'Refresh data'}
        </button>
      )}
      {feed.error && (
        <span role="alert" className="text-rose-500">
          Update failed: {feed.error} Showing {feed.inUse ? 'the last good download' : 'the built-in data'}.
        </span>
      )}
      {feed.skipped.length > 0 && (
        <span title={feed.skipped.join('\n')} className="text-amber-500">
          {feed.skipped.length} feed row{feed.skipped.length === 1 ? '' : 's'} ignored (invalid).
        </span>
      )}
    </div>
  );
};

/** Settings controls for the feed: on/off, address, and a manual refresh. */
export const FeedSettingsPanel: React.FC = () => {
  const { feed, updateSettings } = useProviderData();
  const [enabled, setEnabled] = useState(feed.settings.enabled);
  const [url, setUrl] = useState(feed.settings.url);
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEnabled(feed.settings.enabled);
    setUrl(feed.settings.url);
  }, [feed.settings.enabled, feed.settings.url]);

  const save = () => {
    setSaved(false);
    const trimmed = url.trim();
    if (trimmed !== '') {
      const checked = toWebUrl(trimmed);
      if ('error' in checked) return setProblem(checked.error);
      if (!/^https:\/\//i.test(checked.url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(checked.url)) {
        return setProblem('The feed address must start with https://.');
      }
    }
    setProblem(null);
    updateSettings({ enabled, url: trimmed });
    setSaved(true);
  };

  return (
    <div
      className="p-4 rounded-xl border space-y-3 sm:col-span-2"
      style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
    >
      <div className="flex items-center gap-2">
        <CloudDownload className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--theme-text)' }}>
          Live provider data
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
        Free-tier quotas and which providers are still free change often. LocalMind can download a small public JSON file with the
        latest provider facts and use it instead of the built-in data. Only that file is downloaded, no personal data is sent, and a
        failed or invalid download never replaces what you already have. Checked at most once a day, or press Refresh.
      </p>
      <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--theme-text)' }}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>Use live provider data</span>
      </label>
      <div className="space-y-1">
        <label htmlFor="feed-url" className="text-xs font-medium block" style={{ color: 'var(--theme-text)' }}>
          Feed address
        </label>
        <input
          id="feed-url"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSaved(false);
          }}
          placeholder="https://raw.githubusercontent.com/<owner>/<repo>/main/feed/providers.json"
          className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border focus:outline-none"
          style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={save}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer active:scale-95"
          style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000000)' }}
        >
          Save
        </button>
        {problem && (
          <span role="alert" className="text-xs text-rose-500 font-medium">
            {problem}
          </span>
        )}
        {saved && !problem && (
          <span role="status" className="text-xs text-emerald-500 font-medium">
            Saved.
          </span>
        )}
      </div>
      <FeedStatus />
    </div>
  );
};
