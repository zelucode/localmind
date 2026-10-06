import React, { useEffect } from 'react';
import pkg from '../../package.json';
import {
  Sparkles,
  Zap,
  Bookmark,
  KeyRound,
  Search,
  Code2,
  Layers,
  ArrowRight,
  X,
  Gauge,
  ShieldCheck,
  Check
} from 'lucide-react';
import { ActiveView } from '../types';

interface StartupWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showOnStartup: boolean;
  onToggleShowOnStartup: (show: boolean) => void;
  onNavigate: (view: ActiveView) => void;
  onOpenKeyVault: () => void;
  onOpenGlobalSearch: () => void;
  totalTools: number;
  totalBookmarks: number;
}

export const StartupWelcomeModal: React.FC<StartupWelcomeModalProps> = ({
  isOpen,
  onClose,
  showOnStartup,
  onToggleShowOnStartup,
  onNavigate,
  onOpenKeyVault,
  onOpenGlobalSearch,
  totalTools,
  totalBookmarks,
}) => {
  // Listen for Escape or Enter key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="startup-welcome-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="startup-welcome-modal-container"
        className="relative w-full max-w-3xl my-6 flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        {/* Top Decorative Banner with Brand Accents */}
        <div
          className="relative px-6 sm:px-8 pt-8 pb-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border flex items-center gap-1.5 uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-primary)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unified Workspace</span>
              </span>
              <span
                className="px-2.5 py-0.5 text-[11px] font-medium rounded-full border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  opacity: 0.8,
                }}
              >
                v{pkg.version} Local-First
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              LocalMind & Developer Tools Hub
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed opacity-80">
              Your high-speed launchpad for <strong>{totalTools} AI tools</strong>, free-tier fallback strategies, and <strong>{totalBookmarks} free online developer utilities</strong>.
            </p>
          </div>

          <button
            id="btn-close-startup"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl border opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
            title="Close welcome screen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bento Grid: 4 Core Workspace Modules */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bento Card 1: AI Catalog */}
            <div
              id="bento-ai-catalog"
              onClick={() => {
                onNavigate('tools');
                onClose();
              }}
              className="group p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer hover:shadow-md flex flex-col justify-between space-y-3"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  {totalTools} Models & Tools
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5 group-hover:text-[var(--theme-primary)] transition-colors">
                  <span>LocalMind Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs opacity-75 mt-1 leading-relaxed">
                  Compare AI tools and providers (Gemini, DeepSeek, Groq, OpenRouter), inspect their free tiers, and filter by local file editing permissions.
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--theme-primary)' }}>
                <span>Launch Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Bento Card 2: Online Bookmarks */}
            <div
              id="bento-bookmarks-catalog"
              onClick={() => {
                onNavigate('bookmarks');
                onClose();
              }}
              className="group p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer hover:shadow-md flex flex-col justify-between space-y-3"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="p-2.5 rounded-xl border text-emerald-400"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <Bookmark className="w-5 h-5" />
                </div>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border text-emerald-400"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  {totalBookmarks}+ Online Utilities
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                  <span>{totalBookmarks} Free Online Tool Bookmarks</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs opacity-75 mt-1 leading-relaxed">
                  Instant web utilities: JSON Crack visualizer, regex testers, CyberChef recipes, SVG optimizers, converters, and formatters with no sign-ups.
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2 text-[11px] font-medium text-emerald-400">
                <span>Browse Bookmarks Directory</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Bento Card 3: OmniRoute & Key Vault */}
            <div
              id="bento-key-vault"
              onClick={() => {
                onClose();
                setTimeout(() => onOpenKeyVault(), 100);
              }}
              className="group p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer hover:shadow-md flex flex-col justify-between space-y-3"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="p-2.5 rounded-xl border text-purple-400"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <KeyRound className="w-5 h-5" />
                </div>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  Encrypted on this device
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5 group-hover:text-purple-400 transition-colors">
                  <span>API Key Vault & Rate Quotas</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs opacity-75 mt-1 leading-relaxed">
                  Keys are encrypted on this device, verified live with each provider, inspect RPM/RPD allowances, and export configs for Cursor, Continue, or Cline.
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2 text-[11px] font-medium text-purple-400">
                <span>Configure Keys</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Bento Card 4: Global Spotlight Search */}
            <div
              id="bento-spotlight-search"
              onClick={() => {
                onClose();
                setTimeout(() => onOpenGlobalSearch(), 100);
              }}
              className="group p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer hover:shadow-md flex flex-col justify-between space-y-3"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="p-2.5 rounded-xl border text-sky-400"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <Search className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                    style={{
                      backgroundColor: 'var(--theme-card)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    ⌘K
                  </kbd>
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                    style={{
                      backgroundColor: 'var(--theme-card)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    ?
                  </kbd>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm flex items-center gap-1.5 group-hover:text-sky-400 transition-colors">
                  <span>Spotlight Command Palette</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-xs opacity-75 mt-1 leading-relaxed">
                  Search across all 300+ tools, execute actions, switch themes, open IDE exporters, or trigger Perplexity web fallback in milliseconds.
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2 text-[11px] font-medium text-sky-400">
                <span>Open Search (⌘K)</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Quick Tips Ribbon */}
          <div
            className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="opacity-80">
                <strong>Stored on this device:</strong> your keys, custom tools and bookmarks are never uploaded. LocalMind only contacts a provider when you test a key.
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] opacity-70">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded border text-[10px]">Esc</kbd>
              <span>or</span>
              <kbd className="px-1.5 py-0.5 rounded border text-[10px]">Enter</kbd>
              <span>to launch</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          className="px-6 sm:px-8 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              id="checkbox-show-on-startup"
              checked={showOnStartup}
              onChange={(e) => onToggleShowOnStartup(e.target.checked)}
              className="w-4 h-4 rounded border cursor-pointer accent-[var(--theme-primary)]"
            />
            <span className="opacity-80">
              Show this welcome screen on startup
            </span>
          </label>

          <div className="flex items-center gap-3 ml-auto">
            <button
              id="btn-startup-get-started"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
