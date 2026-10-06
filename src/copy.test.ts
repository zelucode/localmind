/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

// Guards against marketing claims creeping back into the UI. Source files are read as text.
const sources = import.meta.glob(['./**/*.tsx', '../index.html'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const files = Object.entries(sources).filter(([path]) => !/\.test\.tsx?$/.test(path));

const BANNED: [RegExp, string][] = [
  [/\b270\+/, 'a hard-coded bookmark count (use the real number)'],
  [/\b50\+ frontier/i, 'an inflated model count'],
  [/frontier AI models/i, '"frontier AI models" (the catalog is tools, not models)'],
  [/v2\.5/, 'a made-up version number (use package.json)'],
  [/zero-cost/i, '"zero-cost" (free tiers have limits)'],
  [/100% free forever/i, '"100% free forever"'],
  [/100% Private/i, '"100% Private"'],
  [/browser sandbox/i, '"browser sandbox" (this is a desktop app)'],
  [/verified active/i, '"verified active" (nothing is verified live)'],
  [/No Account Required/i, '"No Account Required" for every bookmark'],
];

describe('UI copy', () => {
  it('reads at least the main source files', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(BANNED)('has no %s', (pattern, why) => {
    const hits = files.filter(([, text]) => pattern.test(text)).map(([path]) => path);
    expect(hits, `${why} found in: ${hits.join(', ')}`).toEqual([]);
  });
});
