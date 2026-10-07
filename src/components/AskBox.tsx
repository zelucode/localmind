import React, { useMemo, useState } from 'react';
import { Search, Compass, ChevronDown, Send, Columns2 } from 'lucide-react';
import { AITool } from '../types';
import { openExternal } from '../lib/tauri';
import { copyText } from '../lib/files';
import { acceptsPromptLink, planQuickQuery } from '../lib/quickQuery';
import {
  MAX_COMPARE,
  getAskEngines,
  pickDefaultEngine,
  planCompare,
  readCompareSet,
  readStoredEngineId,
  storeCompareSet,
  storeEngineId,
} from '../lib/askEngines';

interface AskBoxProps {
  tools: AITool[];
  /** Omit to hide the "Which Tool?" button (the Advisor is behind a feature flag). */
  onOpenAdvisor?: (initialPrompt?: string) => void;
}

const EXAMPLES = ['Open source LLM benchmarks', 'DeepSeek-R1 Python debugging', 'Free Gemini 2.5 Flash API guide'];

export const AskBox: React.FC<AskBoxProps> = ({ tools, onOpenAdvisor }) => {
  const [query, setQuery] = useState('');
  const [storedId, setStoredId] = useState<string | null>(readStoredEngineId);
  // Shown after a send that could not carry the prompt in the link (the prompt was copied instead).
  const [notice, setNotice] = useState<string | null>(null);
  // Ask several (internally "compare"): off by default; the picked engines are remembered as the user's set.
  const [compare, setCompare] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>(readCompareSet);

  const engines = useMemo(() => getAskEngines(tools), [tools]);
  const engine = pickDefaultEngine(engines, storedId);

  if (!engine) {
    return (
      <div
        className="border rounded-2xl p-4 sm:p-5 mb-8 text-xs"
        style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)' }}
      >
        No web AI tools in the catalog yet. Add one under AI Tools to ask from here.
      </div>
    );
  }

  const canPrefill = acceptsPromptLink(engine);
  const hasPrompt = query.trim() !== '';

  const chooseEngine = (id: string) => {
    setStoredId(id);
    storeEngineId(id);
    setNotice(null);
  };

  const send = async () => {
    const plan = planQuickQuery(engine, query);
    if (plan.kind === 'copy') {
      const copied = await copyText(plan.text);
      void openExternal(plan.url);
      const why = plan.reason === 'too-long' ? 'Your prompt is too long to send in a link.' : `${engine.name} cannot take a prompt from a link.`;
      setNotice(
        copied
          ? `${why} It was copied to your clipboard: paste it into ${engine.name} (Ctrl+V).`
          : `${why} Copying failed, so select your prompt in the box and copy it yourself.`,
      );
      return;
    }
    setNotice(null);
    void openExternal(plan.url);
  };

  const toggleCompareEngine = (id: string) => {
    setCompareIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_COMPARE ? [...prev, id] : prev;
      storeCompareSet(next);
      return next;
    });
    setNotice(null);
  };

  const comparePlan = planCompare(engines, compareIds, query);
  const compareCount = comparePlan.sends.length;

  const sendCompare = async () => {
    if (compareCount === 0) return;
    // Copy once for the engines that cannot take the prompt from a link; do not wait on it before opening.
    const copying = comparePlan.copyText ? copyText(comparePlan.copyText) : null;
    for (const { plan } of comparePlan.sends) void openExternal(plan.url);
    if (!copying) {
      setNotice(null);
      return;
    }
    const names = comparePlan.pasteInto.map((e) => e.name).join(', ');
    setNotice(
      (await copying)
        ? `Opened ${compareCount} engines. Your prompt was copied: paste it (Ctrl+V) into ${names}.`
        : `Opened ${compareCount} engines. Copying failed, so copy your prompt yourself and paste it into ${names}.`,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void (compare ? sendCompare() : send());
    }
  };

  const compareHint = () => {
    if (compareCount === 0) return 'Pick at least one AI to ask.';
    if (!hasPrompt) return `Opens ${compareCount} site${compareCount === 1 ? '' : 's'}`;
    const prefilled = comparePlan.sends.filter((s) => s.plan.kind === 'prefilled').length;
    const paste = comparePlan.pasteInto.length;
    return `${prefilled} prefilled${paste ? `, ${paste} need a paste (${comparePlan.pasteInto.map((e) => e.name).join(', ')}): the prompt is copied once` : ''}`;
  };

  const hint = !hasPrompt
    ? `Opens ${engine.name}`
    : canPrefill
      ? `Prompt is prefilled in ${engine.name}`
      : `${engine.name} cannot take a prompt from a link: it is copied, then you paste it`;

  return (
    <div
      className="border rounded-2xl p-4 sm:p-5 mb-8 shadow-sm transition-colors"
      style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--theme-raised)', color: 'var(--theme-primary)' }}>
            <Compass className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Ask any free AI</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Your prompt opens in the engine you choose
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full">
          <Search
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
            style={{ color: 'var(--theme-text)' }}
          />
          <input
            id="input-ask-query"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setNotice(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type any question, coding task, or prompt..."
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
          {!compare && (
            <div className="relative">
              <select
                id="select-ask-engine"
                aria-label="Engine"
                value={engine.id}
                onChange={(e) => chooseEngine(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl text-xs font-medium border cursor-pointer focus:outline-none max-w-[11rem]"
                style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
              >
                {engines.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
            </div>
          )}

          <button
            id="btn-ask-compare"
            type="button"
            role="switch"
            aria-checked={compare}
            onClick={() => {
              setCompare((c) => !c);
              setNotice(null);
            }}
            className="px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap hover:opacity-85"
            style={{
              backgroundColor: compare ? 'var(--theme-raised)' : 'transparent',
              borderColor: compare ? 'var(--theme-primary)' : 'var(--theme-border)',
              color: compare ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            }}
            title="Send the same prompt to several AIs at once"
          >
            <Columns2 className="w-3.5 h-3.5" />
            Ask several
          </button>

          <button
            id="btn-ask-send"
            disabled={compare && compareCount === 0}
            onClick={() => void (compare ? sendCompare() : send())}
            title={compare ? comparePlan.sends.map((s) => s.engine.name).join(', ') : undefined}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000000)' }}
          >
            <Send className="w-3.5 h-3.5" />
            {compare ? (compareCount === 0 ? 'Pick AIs' : `Ask ${compareCount} AI${compareCount === 1 ? '' : 's'}`) : 'Ask'}
          </button>

          {onOpenAdvisor && (
            <button
              id="btn-omnibar-advisor"
              onClick={() => onOpenAdvisor(query)}
              className="px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1 border transition-colors cursor-pointer whitespace-nowrap hover:opacity-85"
              style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-primary)' }}
              title="Ask AI Advisor which free tool fits best"
            >
              Which Tool?
            </button>
          )}
        </div>
      </div>

      {compare && (
        <div className="flex items-center gap-1.5 flex-wrap mt-3" role="group" aria-label="Pick the AIs to ask">
          {engines.map((e) => {
            const on = compareIds.includes(e.id);
            const full = !on && compareIds.length >= MAX_COMPARE;
            return (
              <button
                key={e.id}
                type="button"
                aria-pressed={on}
                disabled={full}
                onClick={() => toggleCompareEngine(e.id)}
                title={full ? `You can ask up to ${MAX_COMPARE} AIs at once` : acceptsPromptLink(e) ? 'Prompt is prefilled' : 'Prompt is copied, you paste it'}
                className="text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer whitespace-nowrap hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: on ? 'var(--theme-raised)' : 'transparent',
                  borderColor: on ? 'var(--theme-primary)' : 'var(--theme-border)',
                  color: on ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
                }}
              >
                {on ? '✓ ' : ''}
                {e.name}
              </button>
            );
          })}
          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            {compareIds.length}/{MAX_COMPARE} · your set is remembered
          </span>
        </div>
      )}

      <p className="text-[11px] mt-2" style={{ color: 'var(--theme-text-muted)' }}>
        {compare ? compareHint() : hint}
      </p>
      {notice && (
        <p role="status" className="text-xs font-medium text-emerald-500 mt-1.5">
          {notice}
        </p>
      )}

      <div className="flex items-center gap-2 mt-3 pt-3 border-t overflow-x-auto text-xs" style={{ borderColor: 'var(--theme-border)' }}>
        <span className="text-[11px] shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
          Try:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {EXAMPLES.map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setQuery(sample);
                setNotice(null);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md border transition-all cursor-pointer whitespace-nowrap hover:opacity-80"
              style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
