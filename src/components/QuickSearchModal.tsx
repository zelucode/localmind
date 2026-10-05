import React, { useState } from 'react';
import { X, Search, ExternalLink } from 'lucide-react';
import { AITool } from '../types';
import { openExternal } from '../lib/tauri';

interface QuickSearchModalProps {
  tool: AITool | null;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  tool,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  if (!tool) return null;

  const handleLaunch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      void openExternal(tool.url);
      onClose();
      return;
    }

    if (tool.quickSearchUrlTemplate) {
      const url = tool.quickSearchUrlTemplate.replace('{query}', encodeURIComponent(query.trim()));
      void openExternal(url);
    } else {
      void openExternal(tool.url);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="modal-quick-search"
        className="border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
              Query {tool.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors cursor-pointer opacity-70 hover:opacity-100"
            style={{ color: 'var(--theme-text)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleLaunch} className="p-5 space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
              Enter your prompt or search query to launch into {tool.name}:
            </label>
            <input
              id="input-quick-search-query"
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. explain quantum computing with citations..."
              className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: 'var(--theme-text)',
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
              Press Enter to launch in new tab
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer hover:opacity-85"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                Cancel
              </button>
              <button
                id="btn-launch-search"
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                style={{
                  backgroundColor: 'var(--theme-primary)',
                  color: 'var(--theme-primary-foreground, #000000)',
                }}
              >
                Launch <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
