import { beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_AI_TOOLS } from '../data/defaultTools';
import {
  ASK_ENGINE_STORAGE_KEY,
  COMPARE_SET_STORAGE_KEY,
  MAX_COMPARE,
  getAskEngines,
  pickDefaultEngine,
  planCompare,
  readCompareSet,
  readStoredEngineId,
  storeCompareSet,
  storeEngineId,
} from './askEngines';

const tool = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  url: `https://${id}.example.com`,
  category: 'web-llm' as const,
  ...extra,
});

describe('getAskEngines', () => {
  it('keeps only web chatbots', () => {
    const engines = getAskEngines([tool('a'), tool('b', { category: 'coding-agent' as const })]);
    expect(engines.map((e) => e.id)).toEqual(['a']);
  });

  it('puts favorites first, then tools with a prompt link, then the rest in catalog order', () => {
    const link = 'https://x.example.com/?q={query}';
    const engines = getAskEngines([
      tool('plain1'),
      tool('linked', { quickSearchUrlTemplate: link }),
      tool('plain2', { isFavorite: true }),
      tool('plain3'),
      tool('fav-linked', { isFavorite: true, quickSearchUrlTemplate: link }),
    ]);
    expect(engines.map((e) => e.id)).toEqual(['fav-linked', 'plain2', 'linked', 'plain1', 'plain3']);
  });

  it('every engine in the real catalog is a web chatbot', () => {
    const engines = getAskEngines(INITIAL_AI_TOOLS);
    expect(engines.length).toBeGreaterThan(0);
    expect(engines.every((e) => e.category === 'web-llm')).toBe(true);
  });
});

describe('pickDefaultEngine', () => {
  const engines = [{ id: 'chatgpt' }, { id: 'perplexity' }, { id: 'claude' }];

  it('uses the remembered engine when it exists', () => {
    expect(pickDefaultEngine(engines, 'claude')?.id).toBe('claude');
  });

  it('falls back to Perplexity on first run or when the remembered engine is gone', () => {
    expect(pickDefaultEngine(engines, null)?.id).toBe('perplexity');
    expect(pickDefaultEngine(engines, 'deleted')?.id).toBe('perplexity');
  });

  it('falls back to the first engine when Perplexity is not in the list, and to nothing when empty', () => {
    expect(pickDefaultEngine([{ id: 'x' }, { id: 'y' }], null)?.id).toBe('x');
    expect(pickDefaultEngine([], null)).toBeUndefined();
  });
});

describe('remembered engine storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips the id', () => {
    expect(readStoredEngineId()).toBeNull();
    storeEngineId('claude');
    expect(localStorage.getItem(ASK_ENGINE_STORAGE_KEY)).toBe('claude');
    expect(readStoredEngineId()).toBe('claude');
  });
});

describe('planCompare', () => {
  const link = 'https://x.example.com/?q={query}';
  const engines = [
    tool('a', { quickSearchUrlTemplate: link }),
    tool('b', { quickSearchUrlTemplate: link }),
    tool('c'),
    tool('d'),
    tool('e'),
    tool('f'),
    tool('g'),
  ];

  it('plans every chosen engine in the picked order and lists the paste-only ones', () => {
    const r = planCompare(engines, ['c', 'a'], ' hello ');
    expect(r.sends.map((s) => [s.engine.id, s.plan.kind])).toEqual([
      ['c', 'copy'],
      ['a', 'prefilled'],
    ]);
    expect(r.pasteInto.map((e) => e.id)).toEqual(['c']);
    expect(r.copyText).toBe('hello');
  });

  it('copies nothing when every engine takes the prompt from the link', () => {
    const r = planCompare(engines, ['a', 'b'], 'hi');
    expect(r.pasteInto).toEqual([]);
    expect(r.copyText).toBeNull();
  });

  it('with no prompt it just opens the sites and needs no copy', () => {
    const r = planCompare(engines, ['a', 'c'], '  ');
    expect(r.sends.every((s) => s.plan.kind === 'open')).toBe(true);
    expect(r.copyText).toBeNull();
  });

  it('drops unknown ids and caps at MAX_COMPARE', () => {
    const r = planCompare(engines, ['gone', 'a', 'b', 'c', 'd', 'e', 'f', 'g'], 'x');
    expect(r.sends.map((s) => s.engine.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(r.sends).toHaveLength(MAX_COMPARE);
  });
});

describe('compare set storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips, caps at MAX_COMPARE and survives junk', () => {
    expect(readCompareSet()).toEqual([]);
    storeCompareSet(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(readCompareSet()).toEqual(['a', 'b', 'c', 'd', 'e']);
    localStorage.setItem(COMPARE_SET_STORAGE_KEY, '{not json');
    expect(readCompareSet()).toEqual([]);
    localStorage.setItem(COMPARE_SET_STORAGE_KEY, JSON.stringify(['a', 3, null]));
    expect(readCompareSet()).toEqual(['a']);
  });
});
