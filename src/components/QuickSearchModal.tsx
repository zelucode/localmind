import React, { useState } from 'react';
import { X, Search, ExternalLink } from 'lucide-react';
import { AITool } from '../types';
import { openExternal } from '../lib/tauri';
import { copyText } from '../lib/files';
import { acceptsPromptLink, planQuickQuery } from '../lib/quickQuery';

interface QuickSearchModalProps {
  tool: AITool | null;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  tool,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  // Shown after a launch that could not carry the prompt in the link (the prompt was copied instead).
  const [notice, setNotice] = useState<string | null>(null);

  if (!tool) return null;

  const canPrefill = acceptsPromptLink(tool);

  const handleLaunch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const plan = planQuickQuery(tool, query);

    if (plan.kind === 'copy') {
      const copied = await copyText(plan.text);
      void openExternal(plan.url);
      const why = plan.reason === 'too-long' ? 'Your prompt is too long to send in a link.' : `${tool.name} cannot take a prompt from a link.`;
      setNotice(
        copied
          ? `${why} It was copied to your clipboard: paste it into ${tool.name} (Ctrl+V).`
          : `${why} Copying failed, so select your prompt in the box and copy it yourself.`,
      );
      return;
    }

    void openExternal(plan.url);
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
          {notice && (
            <p role="status" className="text-xs font-medium text-emerald-500">
              {notice}
            </p>
          )}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--theme-text-secondary)' }}>
              Enter your prompt or search query to launch into {tool.name}:
            </label>
            <input
              id="input-quick-search-query"
              type="text"
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNotice(null);
              }}
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
              {canPrefill ? 'Press Enter to launch in new tab' : `${tool.name} cannot take a prompt from a link: Launch copies it for you to paste.`}
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
                {notice ? 'Close' : 'Cancel'}
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
