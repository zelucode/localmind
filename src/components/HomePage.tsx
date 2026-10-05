import React from 'react';
import { ArrowRight, Cpu, KeyRound, LayoutGrid, Bookmark, Gauge, Star } from 'lucide-react';
import { Omnibar } from './Omnibar';
import { ScopeExplainer } from './ScopeExplainer';
import { ActiveView, AITool, StoredApiKey, ToolBookmark } from '../types';

interface HomePageProps {
  tools: AITool[];
  bookmarks: ToolBookmark[];
  keys: StoredApiKey[];
  showScopeExplainer: boolean;
  onNavigate: (view: ActiveView) => void;
  onOpenAdvisor?: (initialPrompt?: string) => void;
}

const StatusCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  onClick: () => void;
}> = ({ icon, title, value, detail, onClick }) => (
  <button
    onClick={onClick}
    className="text-left border rounded-xl p-3.5 flex flex-col gap-1.5 transition-colors cursor-pointer hover:opacity-90 min-w-0"
    style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
  >
    <span className="flex items-center gap-2 text-xs font-semibold">
      <span style={{ color: 'var(--theme-primary)' }}>{icon}</span>
      {title}
    </span>
    <span className="text-sm font-mono truncate">{value}</span>
    <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
      {detail}
      <ArrowRight className="w-3 h-3" />
    </span>
  </button>
);

export const HomePage: React.FC<HomePageProps> = ({
  tools,
  bookmarks,
  keys,
  showScopeExplainer,
  onNavigate,
  onOpenAdvisor,
}) => {
  const favoriteTools = tools.filter((t) => t.isFavorite);
  const favoriteBookmarks = bookmarks.filter((b) => b.isFavorite);
  const untested = keys.filter((k) => k.lastTestedStatus !== 'valid').length;

  const favorites = [
    ...favoriteTools.map((t) => ({ id: `t-${t.id}`, name: t.name, sub: t.badge || 'AI tool', url: t.url })),
    ...favoriteBookmarks.slice(0, 8).map((b) => ({ id: `b-${b.id}`, name: b.title, sub: 'Bookmark', url: b.url })),
  ];

  return (
    <div className="space-y-6">
      <Omnibar
        onOpenAdvisor={onOpenAdvisor}
        onOpenConfigExporter={() => onNavigate('configs')}
        onOpenRateLimitMatrix={() => onNavigate('configs')}
      />

      <section aria-label="Status" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusCard
          icon={<LayoutGrid className="w-4 h-4" />}
          title="AI Tools"
          value={`${tools.length} cataloged`}
          detail="Browse the catalog"
          onClick={() => onNavigate('tools')}
        />
        <StatusCard
          icon={<Bookmark className="w-4 h-4" />}
          title="Bookmarks"
          value={`${bookmarks.length} saved`}
          detail="Open bookmarks"
          onClick={() => onNavigate('bookmarks')}
        />
        <StatusCard
          icon={<KeyRound className="w-4 h-4" />}
          title="Key Vault"
          value={keys.length === 0 ? 'No keys yet' : `${keys.length} key${keys.length === 1 ? '' : 's'}`}
          detail={keys.length === 0 ? 'Add your first key' : untested > 0 ? `${untested} not verified` : 'All verified'}
          onClick={() => onNavigate('vault')}
        />
        <StatusCard
          icon={<Cpu className="w-4 h-4" />}
          title="Runtimes"
          value="Local servers"
          detail="Scan for Ollama, OmniRoute"
          onClick={() => onNavigate('runtimes')}
        />
      </section>

      {showScopeExplainer && <ScopeExplainer />}

      <section aria-label="Favorites" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <Star className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
            Favorites
          </h2>
          <button
            onClick={() => onNavigate('tools')}
            className="text-xs font-medium cursor-pointer hover:underline"
            style={{ color: 'var(--theme-primary)' }}
          >
            All AI Tools
          </button>
        </div>

        {favorites.length === 0 ? (
          <div
            className="border border-dashed rounded-xl p-6 text-center text-xs"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
          >
            Star a tool or bookmark and it shows up here for one-click launch.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favorites.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="border rounded-xl p-3 flex items-center gap-2.5 min-w-0 transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
              >
                <span
                  className="w-8 h-8 rounded-lg grid place-items-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: 'var(--theme-raised)', color: 'var(--theme-primary)' }}
                >
                  {f.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold truncate">{f.name}</span>
                  <span className="block text-[11px] truncate" style={{ color: 'var(--theme-text-muted)' }}>
                    {f.sub}
                  </span>
                </span>
              </a>
            ))}
          </div>
        )}
      </section>

      <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--theme-text-muted)' }}>
        <Gauge className="w-3.5 h-3.5" />
        Free-tier limits and rotation strategy live under Configs &amp; Limits.
      </p>
    </div>
  );
};
