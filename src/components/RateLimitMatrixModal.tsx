import React, { useState, useMemo } from 'react';
import {
  X,
  Gauge,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  Workflow,
  Search,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { openExternal } from '../lib/tauri';
import { RATE_LIMIT_DATA } from '../data/providers';


interface RateLimitMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExporterWithProvider?: (providerId: string) => void;
  /** Render as a normal page section (no overlay, no close buttons). */
  inline?: boolean;
}

export const RateLimitMatrixModal: React.FC<RateLimitMatrixModalProps> = ({
  isOpen,
  onClose,
  inline = false,
  onOpenExporterWithProvider,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'strategy'>('matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'cloud-api' | 'router' | 'local'>('all');

  const filteredItems = useMemo(() => {
    return RATE_LIMIT_DATA.filter((item) => {
      const matchCat = filterCategory === 'all' || item.category === filterCategory;
      const matchSearch =
        item.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bestModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [filterCategory, searchQuery]);

  if (!isOpen && !inline) return null;

  return (
    <div
      id="modal-rate-limit-backdrop"
      className={inline ? '' : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-sm transition-opacity animate-in fade-in'}
      style={inline ? undefined : { backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        id="modal-rate-limit-content"
        className={`w-full rounded-2xl border overflow-hidden flex flex-col transition-all ${inline ? '' : 'max-w-5xl shadow-2xl my-auto max-h-[90vh]'}`}
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        {/* Modal Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="p-2 rounded-xl"
              style={{
                backgroundColor: 'var(--theme-raised)',
                color: 'var(--theme-primary)',
              }}
            >
              <Gauge className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Rate-Limit & Rotation Strategy Matrix
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Free-tier quotas per provider, and the order to fall back through them when one runs out
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div
              className="hidden sm:flex items-center p-1 rounded-xl border text-xs"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <button
                onClick={() => setActiveTab('matrix')}
                className="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor: activeTab === 'matrix' ? 'var(--theme-card)' : 'transparent',
                  color: activeTab === 'matrix' ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                  boxShadow: activeTab === 'matrix' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Quota Matrix
              </button>
              <button
                onClick={() => setActiveTab('strategy')}
                className="px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1"
                style={{
                  backgroundColor: activeTab === 'strategy' ? 'var(--theme-card)' : 'transparent',
                  color: activeTab === 'strategy' ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                  boxShadow: activeTab === 'strategy' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Workflow className="w-3.5 h-3.5" />
                Rotation Chain
              </button>
            </div>

            <button
              id="btn-close-rate-limit"
              onClick={onClose}
              className={`${inline ? 'hidden ' : ''}p-2 rounded-xl border transition-colors cursor-pointer hover:opacity-80`}
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-muted)',
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher for mobile */}
        <div
          className="sm:hidden flex items-center px-4 py-2 border-b text-xs gap-2 shrink-0"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 py-1.5 text-center font-medium rounded-lg border ${
              activeTab === 'matrix' ? 'font-bold' : 'opacity-70'
            }`}
            style={{
              backgroundColor: activeTab === 'matrix' ? 'var(--theme-card)' : 'transparent',
              borderColor: activeTab === 'matrix' ? 'var(--theme-primary)' : 'transparent',
              color: activeTab === 'matrix' ? 'var(--theme-primary)' : 'var(--theme-text)',
            }}
          >
            Quota Matrix
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex-1 py-1.5 text-center font-medium rounded-lg border ${
              activeTab === 'strategy' ? 'font-bold' : 'opacity-70'
            }`}
            style={{
              backgroundColor: activeTab === 'strategy' ? 'var(--theme-card)' : 'transparent',
              borderColor: activeTab === 'strategy' ? 'var(--theme-primary)' : 'transparent',
              color: activeTab === 'strategy' ? 'var(--theme-primary)' : 'var(--theme-text)',
            }}
          >
            Rotation Chain
          </button>
        </div>

        {/* Modal Body */}
        <div className={`p-5 sm:p-6 space-y-6 ${inline ? '' : 'overflow-y-auto'}`}>
          {activeTab === 'matrix' ? (
            <>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                RPM = requests per minute, RPD = requests per day. These numbers are a snapshot and providers change them often, so check the provider before relying on one.
              </p>
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                    style={{ color: 'var(--theme-text)' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search provider, model, role..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none"
                    style={{
                      backgroundColor: 'var(--theme-raised)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text)',
                    }}
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
                  {(['all', 'cloud-api', 'router', 'local'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className="px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap cursor-pointer transition-all"
                      style={{
                        backgroundColor: filterCategory === cat ? 'var(--theme-primary)' : 'var(--theme-raised)',
                        color: filterCategory === cat ? 'var(--theme-primary-foreground, #000)' : 'var(--theme-text)',
                        borderColor: filterCategory === cat ? 'var(--theme-primary)' : 'var(--theme-border)',
                        fontWeight: filterCategory === cat ? 600 : 400,
                      }}
                    >
                      {cat === 'all'
                        ? 'All Providers'
                        : cat === 'cloud-api'
                        ? 'Cloud APIs'
                        : cat === 'router'
                        ? 'Routers'
                        : 'Local Offline'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div
                className="border rounded-xl overflow-x-auto shadow-sm"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr
                      className="border-b text-[11px] uppercase tracking-wider font-semibold"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text-secondary)',
                      }}
                    >
                      <th className="py-3 px-4">Provider & Top Model</th>
                      <th className="py-3 px-3">RPM</th>
                      <th className="py-3 px-3">Daily Cap (RPD)</th>
                      <th className="py-3 px-3">Context Window</th>
                      <th className="py-3 px-3">Latency / Speed</th>
                      <th className="py-3 px-3">Renewal Cycle</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 px-4 text-center text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          No providers match your search.
                        </td>
                      </tr>
                    )}
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-xs" style={{ color: 'var(--theme-text)' }}>
                            {item.provider}
                          </div>
                          <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--theme-primary)' }}>
                            {item.bestModel}
                          </div>
                          <div className="text-[10px] opacity-70 mt-1 max-w-xs" style={{ color: 'var(--theme-text-muted)' }}>
                            {item.role}
                          </div>
                          <div className="text-[10px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                            {item.reviewed ? `Checked ${item.reviewed}` : 'Not re-checked'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono font-semibold">
                          <span
                            className="px-2 py-0.5 rounded text-[11px]"
                            style={{
                              backgroundColor: 'var(--theme-raised)',
                              color: typeof item.rpm === 'number' && item.rpm >= 30 ? '#10b981' : 'var(--theme-text)',
                            }}
                          >
                            {item.rpm} {typeof item.rpm === 'number' ? 'RPM' : ''}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono font-semibold">
                          <span
                            className="px-2 py-0.5 rounded text-[11px]"
                            style={{
                              backgroundColor: 'var(--theme-raised)',
                              color: typeof item.rpd === 'number' && item.rpd >= 1000 ? '#10b981' : 'var(--theme-text)',
                            }}
                          >
                            {typeof item.rpd === 'number' ? item.rpd.toLocaleString() : item.rpd} {typeof item.rpd === 'number' ? 'RPD' : ''}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono">
                          <span
                            className={`text-[11px] font-medium ${
                              item.contextWindow.includes('1,048,576') ? 'text-amber-500 font-bold' : ''
                            }`}
                          >
                            {item.contextWindow}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap font-medium"
                            style={{
                              backgroundColor: 'var(--theme-raised)',
                              borderColor: 'var(--theme-border)',
                              color:
                                item.speed.includes('Ultra')
                                  ? '#10b981'
                                  : item.speed.includes('Fast')
                                  ? '#38bdf8'
                                  : 'var(--theme-text-secondary)',
                            }}
                          >
                            {item.speed}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 opacity-60" />
                            {item.renewalCycle}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenExporterWithProvider && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenExporterWithProvider(item.id);
                                }}
                                className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all hover:opacity-85"
                                style={{
                                  backgroundColor: 'var(--theme-primary)',
                                  color: 'var(--theme-primary-foreground, #000)',
                                  borderColor: 'var(--theme-primary)',
                                }}
                                title="Generate IDE Config for this provider"
                              >
                                <Code2 className="w-3 h-3" />
                                <span>Config</span>
                              </button>
                            )}
                            <a
                              href={item.getKeyUrl}
                              onClick={(e) => {
                                e.preventDefault();
                                void openExternal(item.getKeyUrl);
                              }}
                              className="p-1.5 rounded-lg border text-[11px] hover:opacity-80"
                              style={{
                                backgroundColor: 'var(--theme-raised)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text)',
                              }}
                              title="Get API Key"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Strategic Rotation Blueprint View */
            <div className="space-y-6">
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <h3 className="text-sm font-bold flex items-center gap-2 mb-1" style={{ color: 'var(--theme-text)' }}>
                  <Workflow className="w-4 h-4 text-amber-500" />
                  The "Zero-Cost Daily Coding Chain" Architecture
                </h3>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  When one free tier runs out or rate-limits you, the next one takes over. Quotas change, so treat this as a starting plan, not a guarantee.
                </p>
              </div>

              {/* 4-Tier Pipeline Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                {/* Step 1 */}
                <div
                  className="p-4 rounded-xl border flex flex-col justify-between relative"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                        Tier 1: Big Context
                      </span>
                      <span className="text-xs font-mono font-bold opacity-60">01</span>
                    </div>
                    <h4 className="text-xs font-bold mb-1">Google Gemini 2.5 Flash</h4>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                      <strong>Role:</strong> Repository ingestion, architectural design, complex bug analysis.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t text-[10px] font-mono text-emerald-500" style={{ borderColor: 'var(--theme-border)' }}>
                    1M Token Context • Daily cap varies
                  </div>
                </div>

                {/* Step 2 */}
                <div
                  className="p-4 rounded-xl border flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-500">
                        Tier 2: Speed & Diffs
                      </span>
                      <span className="text-xs font-mono font-bold opacity-60">02</span>
                    </div>
                    <h4 className="text-xs font-bold mb-1">Groq (Llama 3.3 70B)</h4>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                      <strong>Role:</strong> Sub-second inline completions, test generation, linting and syntax fixes.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t text-[10px] font-mono text-emerald-500" style={{ borderColor: 'var(--theme-border)' }}>
                    Very fast • ~1,000 Daily (70B)
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  className="p-4 rounded-xl border flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-500">
                        Tier 3: Burst Buffer
                      </span>
                      <span className="text-xs font-mono font-bold opacity-60">03</span>
                    </div>
                    <h4 className="text-xs font-bold mb-1">OpenRouter Free & Mistral</h4>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                      <strong>Role:</strong> If you burst over your per-minute limit during intensive edits, route requests here (a router like OmniRoute can do this for you).
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t text-[10px] font-mono text-emerald-500" style={{ borderColor: 'var(--theme-border)' }}>
                    DeepSeek R1 :free • Fallback
                  </div>
                </div>

                {/* Step 4 */}
                <div
                  className="p-4 rounded-xl border flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                        Tier 4: Offline Core
                      </span>
                      <span className="text-xs font-mono font-bold opacity-60">04</span>
                    </div>
                    <h4 className="text-xs font-bold mb-1">Ollama / LM Studio</h4>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                      <strong>Role:</strong> Secret keys, sensitive proprietary logic, or when internet connectivity drops.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t text-[10px] font-mono text-emerald-500" style={{ borderColor: 'var(--theme-border)' }}>
                    100% Offline • Unlimited Tokens
                  </div>
                </div>
              </div>

              {/* Practical Rate-Limit Rules */}
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text)' }}>
                  3 Tips to Hit Rate Limits Less Often:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
                    <div className="font-bold text-amber-500 mb-1">1. Debounce IDE Autocomplete</div>
                    <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                      Set Continue.dev or Cline autocomplete debounce to <code>250ms</code> so rapid typing does not burn request limits.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
                    <div className="font-bold text-sky-500 mb-1">2. Keep Index Files Clean</div>
                    <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                      Add <code>node_modules/</code>, <code>dist/</code>, and lockfiles to <code>.aiderignore</code> / <code>.continueignore</code> to conserve token windows.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
                    <div className="font-bold text-emerald-500 mb-1">3. Run Local Proxy Router</div>
                    <p className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                      Use <strong>OmniRoute</strong> on <code>localhost:8000</code>. A local router can retry on HTTP 429 rate limits using your next key.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between text-xs shrink-0 gap-2"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Quotas reviewed Oct 2026 and not checked live. Providers change free tiers often.
            </span>
          </div>
          <button
            onClick={onClose}
            className={`${inline ? 'hidden ' : ''}px-4 py-1.5 rounded-lg border text-xs font-medium cursor-pointer hover:opacity-85`}
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
