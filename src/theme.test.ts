import { describe, expect, it } from 'vitest';
import { defaultThemePresets, migrateThemeId } from './theme';

const ids = new Set(defaultThemePresets.map((p) => p.id));

describe('migrateThemeId', () => {
  it('defaults to Pastel Dusk when nothing is saved', () => {
    expect(migrateThemeId(null)).toBe('pastel-dusk');
    expect(migrateThemeId('')).toBe('pastel-dusk');
  });

  it('leaves current theme ids alone', () => {
    for (const id of ids) expect(migrateThemeId(id)).toBe(id);
  });

  it.each([
    'dark-teal', 'obsidian-emerald', 'midnight-purple', 'nord-ice', 'graphite-steel', 'solar-amber',
    'crimson-rose', 'rosewood', 'cake-night', 'nano-ink', 'light-minimal', 'sage-linen',
    'terracotta-peach', 'light-violet',
  ])('maps retired theme %s to one that exists', (old) => {
    expect(ids.has(migrateThemeId(old))).toBe(true);
  });

  it('keeps light themes light', () => {
    const mode = (id: string) => defaultThemePresets.find((p) => p.id === id)!.mode;
    for (const old of ['light-minimal', 'sage-linen', 'terracotta-peach', 'light-violet']) {
      expect(mode(migrateThemeId(old))).toBe('light');
    }
  });
});
