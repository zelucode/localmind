import { logWarn } from './lib/errorLog';

export interface ThemePreset {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  primaryColor: string; // Hex color for primary accent
  primaryHover: string; // Hex color for primary hover state
  bgCanvas: string; // Background color hex
  cardBg: string; // Card background hex
  borderColor: string; // Border color hex
  textColor: string; // Text color hex
  description: string;

  // Optional semantic-token overrides
  surfaceRaised?: string; // Hover/active fill (e.g. row hover, sidebar active nav)
  borderStrong?: string; // Emphasis border
  textSecondary?: string; // Dimmer than textColor, still body-readable
  textMuted?: string; // Dimmest — captions, placeholders, disabled
  primaryForeground?: string; // Text color to place ON a solid primaryColor fill
}

export const defaultThemePresets: ThemePreset[] = [
  {
    id: 'pastel-dusk',
    name: 'Pastel Dusk',
    mode: 'dark',
    primaryColor: '#e0a8c5',
    primaryHover: '#eec2da',
    primaryForeground: '#1e1e2e',
    bgCanvas: '#1e1e2e',
    cardBg: '#282838',
    surfaceRaised: '#343446',
    borderColor: '#43435a',
    borderStrong: '#5a5a75',
    textColor: '#d8dbe8',
    textSecondary: '#9da3b8',
    textMuted: '#8b91a6',
    description: 'Muted, low-saturation pastel palette for a softer, easier-on-the-eyes dark mode.',
  },
  {
    id: 'blueprint-light',
    name: 'Blueprint',
    mode: 'light',
    primaryColor: '#1d4ed8',
    primaryHover: '#1e3a8a',
    primaryForeground: '#ffffff',
    bgCanvas: '#eff6ff',
    cardBg: '#ffffff',
    surfaceRaised: '#e2e8f0',
    borderColor: '#cbd5e1',
    borderStrong: '#94a3b8',
    textColor: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    description: 'Crisp ink-navy on blueprint-white, for a precise, technical-drawing feel.',
  },
  {
    id: 'soft-paper',
    name: 'Soft Paper',
    mode: 'light',
    primaryColor: '#f7591f',
    primaryHover: '#d94e1b',
    primaryForeground: '#ffffff',
    bgCanvas: '#f6f4ee',
    cardBg: '#ffffff',
    surfaceRaised: '#edeae0',
    borderColor: '#dedad0',
    borderStrong: '#c5c0b4',
    textColor: '#1c1917',
    textSecondary: '#57534e',
    textMuted: '#78716c',
    description: 'Warm paper cream with soft pastel vermillion accents.',
  },
  {
    id: 'aurora-mint',
    name: 'Aurora Mint',
    mode: 'dark',
    primaryColor: '#7fd8c3',
    primaryHover: '#a0e6d5',
    primaryForeground: '#0e1c1c',
    bgCanvas: '#101a1c',
    cardBg: '#172426',
    surfaceRaised: '#1f3033',
    borderColor: '#2a3d40',
    borderStrong: '#3d575b',
    textColor: '#dcebea',
    textSecondary: '#9fb8b6',
    textMuted: '#74908e',
    description: 'Cool teal-tinted dark with a fresh mint accent, calm and focused.',
  },
  {
    id: 'lavender-night',
    name: 'Lavender Night',
    mode: 'dark',
    primaryColor: '#b4a0ff',
    primaryHover: '#c9baff',
    primaryForeground: '#17152a',
    bgCanvas: '#17152a',
    cardBg: '#1f1d36',
    surfaceRaised: '#2a2748',
    borderColor: '#36335a',
    borderStrong: '#4b4778',
    textColor: '#e2e0f5',
    textSecondary: '#a9a6cc',
    textMuted: '#8785ab',
    description: 'Deep indigo evening with a soft periwinkle glow.',
  },
  {
    id: 'ocean-slate',
    name: 'Ocean Slate',
    mode: 'dark',
    primaryColor: '#7cb7ff',
    primaryHover: '#9ccaff',
    primaryForeground: '#101826',
    bgCanvas: '#121a26',
    cardBg: '#1a2434',
    surfaceRaised: '#232f44',
    borderColor: '#2d3b52',
    borderStrong: '#44566f',
    textColor: '#dbe4f0',
    textSecondary: '#9aabc2',
    textMuted: '#7b8da5',
    description: 'Blue-gray slate with a clear sky-blue accent.',
  },
  {
    id: 'ember-clay',
    name: 'Ember Clay',
    mode: 'dark',
    primaryColor: '#f0a27a',
    primaryHover: '#f5b898',
    primaryForeground: '#1d1714',
    bgCanvas: '#1d1714',
    cardBg: '#271f1b',
    surfaceRaised: '#332822',
    borderColor: '#433630',
    borderStrong: '#5c4b43',
    textColor: '#efe3dc',
    textSecondary: '#bba89d',
    textMuted: '#99867b',
    description: 'Warm roasted-clay dark with a peach ember accent.',
  },
  {
    id: 'oled-black',
    name: 'Pitch Black OLED',
    mode: 'dark',
    primaryColor: '#8b8dff',
    primaryHover: '#a5a7ff',
    primaryForeground: '#000000',
    bgCanvas: '#000000',
    cardBg: '#0c0c0e',
    surfaceRaised: '#17171b',
    borderColor: '#222228',
    borderStrong: '#35353d',
    textColor: '#f4f4f8',
    textSecondary: '#a1a1ae',
    textMuted: '#7a7a86',
    description: 'True black for OLED screens with a bright periwinkle accent.',
  },
  {
    id: 'lilac-mist',
    name: 'Lilac Mist',
    mode: 'light',
    primaryColor: '#6d4fd6',
    primaryHover: '#5a3cc0',
    primaryForeground: '#ffffff',
    bgCanvas: '#f6f3fc',
    cardBg: '#ffffff',
    surfaceRaised: '#ede8f8',
    borderColor: '#ddd5f0',
    borderStrong: '#c3b6e3',
    textColor: '#231d3a',
    textSecondary: '#4b4468',
    textMuted: '#6c6589',
    description: 'Soft lilac-tinted light with a rich violet accent.',
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    mode: 'light',
    primaryColor: '#c2415f',
    primaryHover: '#a8334f',
    primaryForeground: '#ffffff',
    bgCanvas: '#fbf3f4',
    cardBg: '#ffffff',
    surfaceRaised: '#f5e6e9',
    borderColor: '#ead7db',
    borderStrong: '#d4b5bc',
    textColor: '#2a1b20',
    textSecondary: '#5c4249',
    textMuted: '#85686f',
    description: 'Blush-white light with a confident raspberry accent.',
  },
];

// Theme ids that were removed or renamed; saved choices map to the closest current theme.
const LEGACY_THEME_IDS: Record<string, string> = {
  'dark-teal': 'aurora-mint',
  'obsidian-emerald': 'aurora-mint',
  'midnight-purple': 'lavender-night',
  'nord-ice': 'ocean-slate',
  'graphite-steel': 'ocean-slate',
  'solar-amber': 'ember-clay',
  'crimson-rose': 'ember-clay',
  rosewood: 'ember-clay',
  'cake-night': 'lavender-night',
  'nano-ink': 'oled-black',
  'light-minimal': 'blueprint-light',
  'sage-linen': 'blueprint-light',
  'terracotta-peach': 'soft-paper',
  'light-violet': 'lilac-mist',
};

export function migrateThemeId(id: string | null | undefined): string {
  if (!id) return 'pastel-dusk';
  return LEGACY_THEME_IDS[id] ?? id;
}

// Utility to convert Hex color to RGB string (e.g. "20, 184, 166")
export function hexToRgb(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return `${r}, ${g}, ${b}`;
}

// Utility to shift brightness of a color for hover state
export function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  let c = (hex || '').replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((ch) => ch + ch).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 20, g: 184, b: 166 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)}`;
}

// Blends hexB into hexA by `weight` (0 = pure A, 1 = pure B).
function mixHex(hexA: string, hexB: string, weight: number): string {
  const a = parseHex(hexA);
  const b = parseHex(hexB);
  const w = Math.min(1, Math.max(0, weight));
  return toHex({
    r: a.r + (b.r - a.r) * w,
    g: a.g + (b.g - a.g) * w,
    b: a.b + (b.b - a.b) * w,
  });
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

export function contrastForeground(hex: string): '#000000' | '#ffffff' {
  const l = relativeLuminance(hex);
  const contrastWithWhite = 1.05 / (l + 0.05);
  const contrastWithBlack = (l + 0.05) / 0.05;
  return contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#000000';
}

const STATUS_COLORS_DARK = {
  danger: '#f87171',
  warning: '#fbbf24',
  success: '#34d399',
  info: '#38bdf8',
  cancelled: '#fb923c',
};

const STATUS_COLORS_LIGHT = {
  danger: '#b91c1c',
  warning: '#9a3412',
  success: '#047857',
  info: '#0369a1',
  cancelled: '#c2410c',
};

const CATEGORY_COLORS_DARK = [
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#84cc16', // lime
  '#d946ef', // fuchsia
];

const CATEGORY_COLORS_LIGHT = [
  '#0f766e', // teal
  '#9a3412', // amber
  '#047857', // emerald
  '#0369a1', // sky
  '#6d28d9', // violet
  '#be123c', // rose
  '#4d7c0f', // lime
  '#a21caf', // fuchsia
];

export interface ResolvedThemeTokens {
  mode: 'dark' | 'light';
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  primaryRgb: string;
  canvas: string;
  card: string;
  raised: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
  dangerForeground: string;
  warning: string;
  warningForeground: string;
  success: string;
  successForeground: string;
  info: string;
  infoForeground: string;
  cancelled: string;
  cancelledForeground: string;
  categories: string[];
}

export function resolveThemeTokens(
  preset: ThemePreset,
  customAccentColor?: string
): ResolvedThemeTokens {
  const primary = customAccentColor || preset.primaryColor;
  const primaryHover = customAccentColor
    ? adjustColorBrightness(customAccentColor, preset.mode === 'dark' ? 15 : -15)
    : preset.primaryHover;
  const status = preset.mode === 'dark' ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;

  const raised = preset.surfaceRaised || mixHex(preset.cardBg, preset.borderColor, 0.6);
  const borderStrong = preset.borderStrong || mixHex(preset.borderColor, preset.textColor, 0.15);
  const textSecondary = preset.textSecondary || mixHex(preset.textColor, preset.cardBg, 0.35);
  const textMuted = preset.textMuted || mixHex(preset.textColor, preset.cardBg, 0.55);

  return {
    mode: preset.mode,
    primary,
    primaryHover,
    primaryForeground: preset.primaryForeground || contrastForeground(primary),
    primaryRgb: hexToRgb(primary),
    canvas: preset.bgCanvas,
    card: preset.cardBg,
    raised,
    border: preset.borderColor,
    borderStrong,
    text: preset.textColor,
    textSecondary,
    textMuted,
    danger: status.danger,
    dangerForeground: contrastForeground(status.danger),
    warning: status.warning,
    warningForeground: contrastForeground(status.warning),
    success: status.success,
    successForeground: contrastForeground(status.success),
    info: status.info,
    infoForeground: contrastForeground(status.info),
    cancelled: status.cancelled,
    cancelledForeground: contrastForeground(status.cancelled),
    categories: preset.mode === 'dark' ? CATEGORY_COLORS_DARK : CATEGORY_COLORS_LIGHT,
  };
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const REQUIRED_COLOR_FIELDS = ['primaryColor', 'primaryHover', 'bgCanvas', 'cardBg', 'borderColor', 'textColor'] as const;
const OPTIONAL_COLOR_FIELDS = ['surfaceRaised', 'borderStrong', 'textSecondary', 'textMuted', 'primaryForeground'] as const;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

/** Why a theme preset can't be used, or null if it is fine. */
export function themePresetProblem(preset: unknown): string | null {
  if (!preset || typeof preset !== 'object' || Array.isArray(preset)) return 'is not an object';
  const p = preset as Record<string, unknown>;
  if (typeof p.id !== 'string' || !p.id.trim()) return 'needs a non-empty "id"';
  if (typeof p.name !== 'string' || !p.name.trim()) return 'needs a non-empty "name"';
  if (p.mode !== 'dark' && p.mode !== 'light') return '"mode" must be "dark" or "light"';
  for (const f of REQUIRED_COLOR_FIELDS) {
    if (!isHexColor(p[f])) return `"${f}" must be a hex color like #1a2b3c`;
  }
  for (const f of OPTIONAL_COLOR_FIELDS) {
    if (p[f] !== undefined && !isHexColor(p[f])) return `"${f}" must be a hex color like #1a2b3c`;
  }
  return null;
}

/** Check a whole preset list (e.g. from the editor or a backup). Returns the first problem, or the cleaned list. */
export function validateThemePresets(value: unknown): { ok: true; presets: ThemePreset[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0) return { ok: false, error: 'Must be a non-empty array of theme presets.' };
  const seen = new Set<string>();
  for (let i = 0; i < value.length; i++) {
    const problem = themePresetProblem(value[i]);
    const label = `Preset ${i + 1}${value[i] && typeof (value[i] as { id?: unknown }).id === 'string' ? ` ("${(value[i] as { id: string }).id}")` : ''}`;
    if (problem) return { ok: false, error: `${label} ${problem}.` };
    const id = (value[i] as ThemePreset).id;
    if (seen.has(id)) return { ok: false, error: `${label} repeats the id "${id}"; ids must be unique.` };
    seen.add(id);
  }
  return { ok: true, presets: value as ThemePreset[] };
}

/** Saved custom presets, minus any that are invalid; the defaults when nothing usable is left. */
export function parseCustomThemesJson(jsonString?: string): ThemePreset[] {
  if (!jsonString) return defaultThemePresets;
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      const usable = parsed.filter((p) => themePresetProblem(p) === null) as ThemePreset[];
      if (usable.length > 0) return usable;
    }
  } catch (err) {
    logWarn('themes', 'Failed to parse custom themes JSON, falling back to defaults', err);
  }
  return defaultThemePresets;
}

export function applyThemeToDocument(
  themeId: string,
  customAccentColor?: string,
  customJson?: string
): ResolvedThemeTokens {
  const presets = parseCustomThemesJson(customJson);
  const activePreset = presets.find((p) => p.id === themeId) || presets[0];
  const tokens = resolveThemeTokens(activePreset, customAccentColor);

  const root = document.documentElement;

  // Set Light/Dark class mode
  if (tokens.mode === 'light') {
    root.classList.add('light-mode');
  } else {
    root.classList.remove('light-mode');
  }
  document.body.style.backgroundColor = tokens.canvas;
  document.body.style.color = tokens.text;

  // Remembered so the static boot splash in index.html can paint in the active theme
  try {
    localStorage.setItem(
      'localmind_boot_theme_v1',
      JSON.stringify({
        bg: tokens.canvas,
        text: tokens.text,
        primary: tokens.primary,
        muted: tokens.textMuted,
        border: tokens.border,
      })
    );
  } catch {
    // storage unavailable; splash falls back to defaults
  }

  // Set dynamic CSS variables
  root.style.setProperty('--theme-primary', tokens.primary);
  root.style.setProperty('--theme-primary-hover', tokens.primaryHover);
  root.style.setProperty('--theme-primary-foreground', tokens.primaryForeground);
  root.style.setProperty('--theme-primary-rgb', tokens.primaryRgb);
  root.style.setProperty('--theme-bg', tokens.canvas);
  root.style.setProperty('--theme-card', tokens.card);
  root.style.setProperty('--theme-raised', tokens.raised);
  root.style.setProperty('--theme-border', tokens.border);
  root.style.setProperty('--theme-border-strong', tokens.borderStrong);
  root.style.setProperty('--theme-text', tokens.text);
  root.style.setProperty('--theme-text-secondary', tokens.textSecondary);
  root.style.setProperty('--theme-text-muted', tokens.textMuted);
  root.style.setProperty('--theme-danger', tokens.danger);
  root.style.setProperty('--theme-danger-foreground', tokens.dangerForeground);
  root.style.setProperty('--theme-warning', tokens.warning);
  root.style.setProperty('--theme-warning-foreground', tokens.warningForeground);
  root.style.setProperty('--theme-success', tokens.success);
  root.style.setProperty('--theme-success-foreground', tokens.successForeground);
  root.style.setProperty('--theme-info', tokens.info);
  root.style.setProperty('--theme-info-foreground', tokens.infoForeground);
  root.style.setProperty('--theme-cancelled', tokens.cancelled);
  root.style.setProperty('--theme-cancelled-foreground', tokens.cancelledForeground);
  tokens.categories.forEach((hex, i) => root.style.setProperty(`--theme-category-${i}`, hex));

  return tokens;
}
