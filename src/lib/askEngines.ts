import { AITool } from '../types';
import { acceptsPromptLink, planQuickQuery, QuickQueryPlan } from './quickQuery';

export type AskEngine = Pick<AITool, 'id' | 'name' | 'url' | 'quickSearchUrlTemplate' | 'isFavorite' | 'category'>;

/** Where the user's chosen default engine is remembered. */
export const ASK_ENGINE_STORAGE_KEY = 'localmind_ask_engine_v1';

/** First run falls back to this when it is in the catalog (reliable prompt link). */
const FIRST_RUN_ENGINE_ID = 'perplexity';

/**
 * Engines the Ask box can send to: web chatbots from the catalog.
 * Favorites first, then tools that take the prompt from the link, then catalog order.
 */
export function getAskEngines<T extends AskEngine>(tools: T[]): T[] {
  const rank = (t: T) => (t.isFavorite ? 0 : 2) + (acceptsPromptLink(t) ? 0 : 1);
  return tools
    .filter((t) => t.category === 'web-llm')
    .map((t, i) => ({ t, i }))
    .sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i)
    .map(({ t }) => t);
}

/** The remembered engine if it still exists, else Perplexity, else the first engine. */
export function pickDefaultEngine<T extends { id: string }>(engines: T[], storedId: string | null): T | undefined {
  return (
    engines.find((e) => e.id === storedId) ?? engines.find((e) => e.id === FIRST_RUN_ENGINE_ID) ?? engines[0]
  );
}

export function readStoredEngineId(): string | null {
  try {
    return localStorage.getItem(ASK_ENGINE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeEngineId(id: string): void {
  try {
    localStorage.setItem(ASK_ENGINE_STORAGE_KEY, id);
  } catch {
    // Remembering the engine is a convenience; ignore storage failures.
  }
}

/** Most engines one Compare send may open; more than this floods the browser and the user. */
export const MAX_COMPARE = 5;

/** Where the user's saved Compare set (engine ids) is remembered. */
export const COMPARE_SET_STORAGE_KEY = 'localmind_ask_compare_set_v1';

export function readCompareSet(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(COMPARE_SET_STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function storeCompareSet(ids: string[]): void {
  try {
    localStorage.setItem(COMPARE_SET_STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_COMPARE)));
  } catch {
    // The saved set is a convenience; ignore storage failures.
  }
}

export interface ComparePlan<T> {
  /** What to open, in the order the user picked. */
  sends: { engine: T; plan: QuickQueryPlan }[];
  /** Engines that cannot take the prompt from a link: the user pastes it there. */
  pasteInto: T[];
  /** Prompt to copy once for the paste engines, or null when none needs it. */
  copyText: string | null;
}

/** Plan one prompt for several engines. Ids that are no longer engines are dropped; at most MAX_COMPARE are used. */
export function planCompare<T extends AskEngine>(engines: T[], selectedIds: string[], query: string): ComparePlan<T> {
  const chosen = selectedIds
    .map((id) => engines.find((e) => e.id === id))
    .filter((e): e is T => !!e)
    .slice(0, MAX_COMPARE);
  const sends = chosen.map((engine) => ({ engine, plan: planQuickQuery(engine, query) }));
  const pasteInto = sends.filter((s) => s.plan.kind === 'copy').map((s) => s.engine);
  return { sends, pasteInto, copyText: pasteInto.length > 0 ? query.trim() : null };
}
