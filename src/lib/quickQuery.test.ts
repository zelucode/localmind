import { describe, expect, it } from 'vitest';
import { INITIAL_AI_TOOLS } from '../data/defaultTools';
import { MAX_QUERY_URL_LENGTH, acceptsPromptLink, planQuickQuery } from './quickQuery';

const perplexity = { url: 'https://www.perplexity.ai', quickSearchUrlTemplate: 'https://www.perplexity.ai/search?q={query}' };
const noSlot = { url: 'https://aistudio.google.com', quickSearchUrlTemplate: 'https://aistudio.google.com/prompts/new_chat' };
const plain = { url: 'https://example.com' };

describe('planQuickQuery', () => {
  it('opens the tool when nothing was typed', () => {
    expect(planQuickQuery(perplexity, '   ')).toEqual({ kind: 'open', url: 'https://www.perplexity.ai' });
    expect(planQuickQuery(noSlot, '')).toEqual({ kind: 'open', url: 'https://aistudio.google.com' });
  });

  it('puts the encoded prompt into the link when the tool supports it', () => {
    expect(planQuickQuery(perplexity, '  what is 1+1? & more  ')).toEqual({
      kind: 'prefilled',
      url: 'https://www.perplexity.ai/search?q=what%20is%201%2B1%3F%20%26%20more',
    });
  });

  it('fills every placeholder, not just the first', () => {
    const tool = { url: 'https://x.com', quickSearchUrlTemplate: 'https://x.com/?a={query}&b={query}' };
    expect(planQuickQuery(tool, 'hi')).toEqual({ kind: 'prefilled', url: 'https://x.com/?a=hi&b=hi' });
  });

  it('never drops the prompt for a tool whose template has no place for it (it used to open a blank chat)', () => {
    expect(planQuickQuery(noSlot, 'my prompt')).toEqual({ kind: 'copy', url: 'https://aistudio.google.com', text: 'my prompt', reason: 'no-prompt-link' });
    expect(planQuickQuery(plain, 'my prompt')).toMatchObject({ kind: 'copy', reason: 'no-prompt-link' });
  });

  it('copies instead of building a link too long to open', () => {
    const long = 'a'.repeat(MAX_QUERY_URL_LENGTH);
    expect(planQuickQuery(perplexity, long)).toMatchObject({ kind: 'copy', reason: 'too-long', url: 'https://www.perplexity.ai', text: long });
  });

  it('refuses a template that is not a web link', () => {
    expect(acceptsPromptLink({ quickSearchUrlTemplate: 'javascript:alert({query})' })).toBe(false);
    expect(acceptsPromptLink({ quickSearchUrlTemplate: 'file:///x?q={query}' })).toBe(false);
  });
});

describe('catalog templates', () => {
  const withTemplate = INITIAL_AI_TOOLS.filter((t) => t.quickSearchUrlTemplate);

  it('exist for some tools', () => {
    expect(withTemplate.length).toBeGreaterThan(0);
  });

  it.each(withTemplate.map((t) => [t.name, t.quickSearchUrlTemplate!]))('%s has a valid https template', (_name, template) => {
    expect(template).toMatch(/^https:\/\//);
    expect(() => new URL(template.replace(/\{query\}/g, 'x'))).not.toThrow();
  });

  it('are on the same site as the tool they belong to', () => {
    for (const t of withTemplate) {
      const host = (u: string) => new URL(u.replace(/\{query\}/g, 'x')).hostname.replace(/^www\./, '');
      expect(host(t.quickSearchUrlTemplate!), t.name).toBe(host(t.url));
    }
  });
});
