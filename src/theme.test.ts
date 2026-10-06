import { describe, expect, it } from 'vitest';
import { defaultThemePresets, isHexColor, migrateThemeId, parseCustomThemesJson, themePresetProblem, validateThemePresets } from './theme';

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

describe('theme preset validation', () => {
  const good = defaultThemePresets[0];

  it('accepts every built-in preset', () => {
    for (const p of defaultThemePresets) expect(themePresetProblem(p), p.id).toBeNull();
    expect(validateThemePresets(defaultThemePresets)).toMatchObject({ ok: true });
  });

  it('recognizes hex colors only', () => {
    for (const ok of ['#fff', '#FFFFFF', '#1a2b3c']) expect(isHexColor(ok), ok).toBe(true);
    for (const bad of ['red', '#12', '#12345', '#gggggg', 'url(x)', '', undefined, 5]) expect(isHexColor(bad), String(bad)).toBe(false);
  });

  it.each([
    [{}, /"id"/],
    [{ ...defaultThemePresets[0], name: '' }, /"name"/],
    [{ ...defaultThemePresets[0], mode: 'blue' }, /"mode"/],
    [{ ...defaultThemePresets[0], bgCanvas: 'red' }, /"bgCanvas".*hex/],
    [{ ...defaultThemePresets[0], textMuted: 'nope' }, /"textMuted".*hex/],
  ])('rejects a broken preset %#', (preset, message) => {
    expect(themePresetProblem(preset)).toMatch(message);
  });

  it('names the failing preset and rejects empty lists, non-arrays and repeated ids', () => {
    expect(validateThemePresets([good, { id: 'x' }])).toEqual({ ok: false, error: 'Preset 2 ("x") needs a non-empty "name".' });
    expect(validateThemePresets([])).toMatchObject({ ok: false });
    expect(validateThemePresets({})).toMatchObject({ ok: false });
    expect(validateThemePresets([good, good])).toMatchObject({ ok: false, error: expect.stringContaining('repeats the id') });
  });

  it('never lets saved garbage reach the theme engine: invalid presets are dropped, defaults used if none are left', () => {
    expect(parseCustomThemesJson(JSON.stringify([{ id: 'x' }]))).toBe(defaultThemePresets);
    expect(parseCustomThemesJson('not json')).toBe(defaultThemePresets);
    expect(parseCustomThemesJson(JSON.stringify([good, { id: 'x' }]))).toEqual([good]);
    expect(parseCustomThemesJson(undefined)).toBe(defaultThemePresets);
  });
});
