import React, { useState } from 'react';
import { Search, Compass, Bot, Code2, Gauge } from 'lucide-react';
import { openExternal } from '../lib/tauri';

interface OmnibarProps {
  /** Omit to hide the "Which Tool?" button (the Advisor is behind a feature flag). */
  onOpenAdvisor?: (initialPrompt?: string) => void;
  onOpenConfigExporter?: () => void;
  onOpenRateLimitMatrix?: () => void;
}

export const Omnibar: React.FC<OmnibarProps> = ({
  onOpenAdvisor,
  onOpenConfigExporter,
  onOpenRateLimitMatrix,
}) => {
  const [query, setQuery] = useState('');

  const launchPerplexity = () => {
    if (!query.trim()) {
      void openExternal('https://www.perplexity.ai');
      return;
    }
    const url = `https://www.perplexity.ai/search?q=${encodeURIComponent(query.trim())}`;
    void openExternal(url);
  };

  const launchChatGPT = () => {
    if (!query.trim()) {
      void openExternal('https://chatgpt.com');
      return;
    }
    const url = `https://chatgpt.com/?q=${encodeURIComponent(query.trim())}`;
    void openExternal(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      launchPerplexity();
    }
  };

  return (
    <div
      className="border rounded-2xl p-4 sm:p-5 mb-8 shadow-sm transition-colors"
      style={{
        backgroundColor: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text)',
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="p-1.5 rounded-lg"
            style={{
              backgroundColor: 'var(--theme-raised)',
              color: 'var(--theme-primary)',
            }}
          >
            <Compass className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--theme-text)' }}>
            AI Universal Omnibar & Quick Launcher
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Type prompt once &rarr; Launch instantly in your preferred free AI engine
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
            style={{ color: 'var(--theme-text)' }}
          />
          <input
            id="input-omnibar-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type any search query, coding task, or prompt..."
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: 'var(--theme-text)',
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0">
          <button
            id="btn-omnibar-perplexity"
            onClick={launchPerplexity}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
            style={{
              backgroundColor: 'var(--theme-primary)',
              color: 'var(--theme-primary-foreground, #000000)',
            }}
            title="Search the web with sources on Perplexity"
          >
            <Search className="w-3.5 h-3.5" />
            Perplexity Search
          </button>

          <button
            id="btn-omnibar-chatgpt"
            onClick={launchChatGPT}
            className="px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
            title="Send prompt to ChatGPT"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-500" />
            ChatGPT
          </button>

          {onOpenAdvisor && (
          <button
            id="btn-omnibar-advisor"
            onClick={() => onOpenAdvisor(query)}
            className="px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-primary)',
            }}
            title="Ask AI Advisor which free tool fits best"
          >
            Which Tool?
          </button>
          )}

          {onOpenConfigExporter && (
            <button
              id="btn-omnibar-configs"
              onClick={onOpenConfigExporter}
              className="px-2.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap hover:opacity-85"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              title="Export 1-click configs for Cline, Continue, Cursor & Aider"
            >
              <Code2 className="w-3.5 h-3.5 text-sky-500" />
              IDE Configs
            </button>
          )}

          {onOpenRateLimitMatrix && (
            <button
              id="btn-omnibar-limits"
              onClick={onOpenRateLimitMatrix}
              className="px-2.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap hover:opacity-85"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              title="View Rate Limits & Zero-Cost Rotation Strategy"
            >
              <Gauge className="w-3.5 h-3.5 text-amber-500" />
              Limits
            </button>
          )}
        </div>
      </div>

      {/* Suggested Quick Queries */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t overflow-x-auto text-xs" style={{ borderColor: 'var(--theme-border)' }}>
        <span className="text-[11px] shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
          Try searching:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            'Open source LLM benchmarks',
            'DeepSeek-R1 Python debugging',
            'Free Gemini 2.5 Flash API guide',
          ].map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setQuery(sample);
                const url = `https://www.perplexity.ai/search?q=${encodeURIComponent(sample)}`;
                void openExternal(url);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer whitespace-nowrap hover:opacity-80"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
