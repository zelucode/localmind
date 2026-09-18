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
    textMuted: '#6e7488',
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
    id: 'dark-teal',
    name: 'Cyberpunk Teal',
    mode: 'dark',
    primaryColor: '#14b8a6',
    primaryHover: '#2dd4bf',
    bgCanvas: '#09090b',
    cardBg: '#18181b',
    borderColor: '#27272a',
    textColor: '#f4f4f5',
    description: 'High-tech dark workstation theme with vibrant teal accents.',
  },
  {
    id: 'obsidian-emerald',
    name: 'Obsidian Emerald',
    mode: 'dark',
    primaryColor: '#10b981',
    primaryHover: '#34d399',
    bgCanvas: '#05100a',
    cardBg: '#0b1a12',
    borderColor: '#143322',
    textColor: '#ecfdf5',
    description: 'Sleek dark obsidian backdrop with emerald green glow.',
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Violet',
    mode: 'dark',
    primaryColor: '#a855f7',
    primaryHover: '#c084fc',
    bgCanvas: '#0f0919',
    cardBg: '#181028',
    borderColor: '#2e1e4a',
    textColor: '#f3e8ff',
    description: 'Deep violet ambient night theme for focused code automation.',
  },
  {
    id: 'nord-ice',
    name: 'Nordic Ice Blue',
    mode: 'dark',
    primaryColor: '#3b82f6',
    primaryHover: '#60a5fa',
    bgCanvas: '#0b1320',
    cardBg: '#111c2e',
    borderColor: '#1e293b',
    textColor: '#eff6ff',
    description: 'Cool arctic blue atmosphere with crisp contrast.',
  },
  {
    id: 'solar-amber',
    name: 'Solar Amber',
    mode: 'dark',
    primaryColor: '#f59e0b',
    primaryHover: '#fbbf24',
    bgCanvas: '#120d04',
    cardBg: '#1e170a',
    borderColor: '#332712',
    textColor: '#fffbeb',
    description: 'Warm golden amber highlights on dark basalt canvas.',
  },
  {
    id: 'crimson-rose',
    name: 'Crimson Rose',
    mode: 'dark',
    primaryColor: '#f43f5e',
    primaryHover: '#fb7185',
    bgCanvas: '#14090c',
    cardBg: '#201015',
    borderColor: '#3d1a24',
    textColor: '#fff1f2',
    description: 'Energetic rose red theme with rich dark contrast.',
  },
  {
    id: 'oled-black',
    name: 'Pitch Black OLED',
    mode: 'dark',
    primaryColor: '#6366f1',
    primaryHover: '#818cf8',
    bgCanvas: '#000000',
    cardBg: '#0a0a0a',
    borderColor: '#1e1e1e',
    textColor: '#ffffff',
    description: 'Pure #000000 dark canvas optimized for OLED screens.',
  },
  {
    id: 'graphite-steel',
    name: 'Graphite',
    mode: 'dark',
    primaryColor: '#94a3b8',
    primaryHover: '#cbd5e1',
    bgCanvas: '#020617',
    cardBg: '#0f172a',
    borderColor: '#1e293b',
    textColor: '#f8fafc',
    description: 'Neutral steel gray with no accent color competing for attention.',
  },
  {
    id: 'light-minimal',
    name: 'Concrete',
    mode: 'light',
    primaryColor: '#64748b',
    primaryHover: '#475569',
    primaryForeground: '#ffffff',
    bgCanvas: '#f8fafc',
    cardBg: '#ffffff',
    surfaceRaised: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderStrong: '#cbd5e1',
    textColor: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    description: 'Neutral graphite gray with clean, distraction-free light workspace.',
  },
  {
    id: 'light-violet',
    name: 'Pastel Lavender Light',
    mode: 'light',
    primaryColor: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryForeground: '#ffffff',
    bgCanvas: '#fdfbff',
    cardBg: '#ffffff',
    surfaceRaised: '#f5f3ff',
    borderColor: '#e9d5ff',
    borderStrong: '#d8b4fe',
    textColor: '#1e1b4b',
    textSecondary: '#4338ca',
    textMuted: '#6b7280',
    description: 'Soft lavender tinted light theme with vivid violet highlights.',
  },
];

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

export function parseCustomThemesJson(jsonString?: string): ThemePreset[] {
  if (!jsonString) return defaultThemePresets;
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
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
