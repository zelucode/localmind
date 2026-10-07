import React, { useState } from 'react';
import { CapabilityScope } from '../types';
import { Globe, HardDrive, Terminal, Info, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScopeExplainerProps {
  /** When given, each column gets a button that shows only the tools of that scope. */
  onShowScope?: (scope: CapabilityScope) => void;
}

export const ScopeExplainer: React.FC<ScopeExplainerProps> = ({ onShowScope }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const showButton = (scope: CapabilityScope, label: string) =>
    onShowScope && (
      <button
        type="button"
        onClick={() => onShowScope(scope)}
        className="mt-2 self-start text-[11px] font-medium underline cursor-pointer"
        style={{ color: 'var(--theme-primary)' }}
      >
        {label}
      </button>
    );

  return (
    <div
      className="border rounded-xl p-4 sm:p-5 shadow-sm mb-6 transition-colors"
      style={{
        backgroundColor: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="p-2.5 rounded-lg mt-0.5 sm:mt-0"
            style={{
              backgroundColor: 'var(--theme-raised)',
              color: 'var(--theme-primary)',
            }}
          >
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                Understanding AI Tool Scopes: Web vs. Local Files
              </h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium border"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  color: 'var(--theme-primary)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                Key Distinction
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
              Web LLM interfaces cannot modify local files on your computer. To edit local codebases, use Desktop Agents or IDE extensions.
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-scope-explainer"
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start sm:self-center flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap cursor-pointer hover:opacity-85"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-primary)',
          }}
        >
          {isExpanded ? (
            <>
              Hide Scope Details <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              View Scope Breakdown <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t animate-in fade-in duration-200"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          {/* Web Only */}
          <div
            className="p-3.5 rounded-lg border flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded bg-sky-500/10 text-sky-500">
                  <Globe className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-sky-500">Web LLMs (Cloud Preview)</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                Platforms like <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>Perplexity, ChatGPT, Claude Web, DeepSeek Web</span> run inside your browser.
              </p>
              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Great for search, brainstorming & reading docs</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Cannot edit or write local files on your machine</span>
                </div>
              </div>
            </div>
            <div
              className="mt-3 text-[11px] border-t pt-2"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-muted)',
              }}
            >
              Requires manual copy-pasting code into your editor.
            </div>
            {showButton('web-only', 'Show web-only tools')}
          </div>

          {/* Local Agents */}
          <div
            className="p-3.5 rounded-lg border flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-500">
                  <Terminal className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold text-emerald-500">Desktop & Local Agents</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                Tools like <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>Cursor, VSCode Copilot, Aider, OpenCode, Kilo Code</span> have native OS access.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-emerald-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Scans folder trees, refactors code & runs tests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Directly modifies local files and writes commits</span>
                </div>
              </div>
            </div>
            <div
              className="mt-3 text-[11px] border-t pt-2"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-muted)',
              }}
            >
              Free plans available via VSCode Copilot, Cursor trial, or free Gemini key with Aider.
            </div>
            {showButton('local-agent', 'Show local agents')}
          </div>

          {/* Local Model Runners & Proxies */}
          <div
            className="p-3.5 rounded-lg border flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="p-1.5 rounded"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  <HardDrive className="w-4 h-4" />
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--theme-primary)' }}>
                  Offline Runners & OmniRoute
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                Local runtimes like <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>Ollama, LM Studio</span> & routing proxies like <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>OmniRoute</span>.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-emerald-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Free to run on your own hardware; no account needed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>OmniRoute bridges free tier providers into port 8000</span>
                </div>
              </div>
            </div>
            <div
              className="mt-3 text-[11px] border-t pt-2"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-muted)',
              }}
            >
              Use Runtimes in the sidebar to check which local servers are running.
            </div>
            {showButton('local-runner', 'Show local runners')}
          </div>
        </div>
      )}
    </div>
  );
};
