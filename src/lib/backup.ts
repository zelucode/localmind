import { AITool, StoredApiKey, ToolBookmark } from '../types';
import { isHexColor, validateThemePresets } from '../theme';
import { applyImport, parseImport, safeHttpUrl } from './bookmarkTransfer';
import { keysForBackup } from './secureKeys';

export const BACKUP_VERSION = 2;

export interface BackupPreferences {
  defaultLaunchSearch?: boolean;
  showScopeExplainer?: boolean;
  showStartupScreen?: boolean;
  showLoadingAnimation?: boolean;
}

/** What the app hands over to be written to a backup file. */
export interface BackupInput {
  customTools: AITool[];
  favIds: string[];
  keys: StoredApiKey[];
  bookmarks: ToolBookmark[];
  themeId: string;
  customAccentColor?: string;
  customThemeJson?: string;
  preferences: BackupPreferences;
}

/** The sections of a backup that were present and passed validation. Absent sections are left alone on restore. */
export interface ParsedBackup {
  exportedAt?: string;
  customTools?: AITool[];
  favIds?: string[];
  keys?: StoredApiKey[];
  bookmarks?: ToolBookmark[];
  themeId?: string;
  customAccentColor?: string;
  customThemeJson?: string;
  preferences?: BackupPreferences;
}

export interface BackupSummary {
  exportedAt?: string;
  customTools: number;
  keys: number;
  bookmarks: number;
  customThemes: number;
  hasTheme: boolean;
  hasPreferences: boolean;
  /** Which sections the file contains; a restore replaces exactly these and leaves the rest alone. */
  has: { customTools: boolean; keys: boolean; bookmarks: boolean; customThemes: boolean };
}

export type BackupParseResult =
  | { ok: true; backup: ParsedBackup; summary: BackupSummary; warnings: string[] }
  | { ok: false; error: string };

export function backupFilename(now = new Date(), encrypted = false): string {
  return `localmind-backup-${now.toISOString().slice(0, 10)}${encrypted ? '-encrypted' : ''}.json`;
}

/** Marker written by the Rust side (`backupcrypto.rs`) into a passphrase-protected backup. */
export const ENCRYPTED_BACKUP_FORMAT = 'localmind-encrypted-backup';
export const MIN_PASSPHRASE_LENGTH = 8;
export const MAX_PASSPHRASE_LENGTH = 256;

/** True when the file is a passphrase-protected backup (it must be opened with its passphrase first). */
export function isEncryptedBackup(text: string): boolean {
  try {
    const data = JSON.parse(text);
    return typeof data === 'object' && data !== null && data.format === ENCRYPTED_BACKUP_FORMAT;
  } catch {
    return false;
  }
}

/** Why a new passphrase can't be used, or null when it is fine. Counted in characters, like the Rust side. */
export function passphraseProblem(passphrase: string, confirmation: string): string | null {
  const length = Array.from(passphrase).length;
  if (length < MIN_PASSPHRASE_LENGTH) return `Use at least ${MIN_PASSPHRASE_LENGTH} characters.`;
  if (length > MAX_PASSPHRASE_LENGTH) return `Use at most ${MAX_PASSPHRASE_LENGTH} characters.`;
  if (passphrase !== confirmation) return 'The two passphrases do not match.';
  return null;
}

/** The JSON text of a full backup. API keys are included only when asked for (they are written as plain text). */
export function buildBackup(input: BackupInput, options: { includeKeys: boolean }, now = new Date()): string {
  const data: Record<string, unknown> = {
    app: 'LocalMind',
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    customTools: input.customTools,
    favIds: input.favIds,
    bookmarks: input.bookmarks,
    themeId: input.themeId,
    customAccentColor: input.customAccentColor,
    customThemeJson: input.customThemeJson,
    preferences: input.preferences,
  };
  if (options.includeKeys) data.keys = keysForBackup(input.keys);
  return JSON.stringify(data, null, 2);
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Read and check a backup file. Never throws; nothing is applied here. */
export function parseBackup(text: string): BackupParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ''));
  } catch (err) {
    return { ok: false, error: `This is not a valid JSON file: ${err instanceof Error ? err.message : 'syntax error'}` };
  }
  if (!isObject(raw)) return { ok: false, error: 'This file is not a LocalMind backup.' };

  const backup: ParsedBackup = {};
  const warnings: string[] = [];

  if (typeof raw.exportedAt === 'string') backup.exportedAt = raw.exportedAt;

  if (Array.isArray(raw.customTools)) {
    const valid = raw.customTools.filter(
      (t): t is AITool => isObject(t) && typeof t.id === 'string' && typeof t.name === 'string' && safeHttpUrl(t.url) !== null,
    );
    const dropped = raw.customTools.length - valid.length;
    if (dropped) warnings.push(`${dropped} custom tool(s) were left out (missing id or name, or not an http/https link).`);
    backup.customTools = valid.map((t) => ({ ...t, isCustom: true }));
    backup.favIds = Array.isArray(raw.favIds) ? raw.favIds.filter((id): id is string => typeof id === 'string') : [];
  }

  if (Array.isArray(raw.keys)) {
    const valid = raw.keys.filter(
      (k): k is StoredApiKey => isObject(k) && typeof k.id === 'string' && typeof k.provider === 'string' && typeof k.key === 'string' && k.key !== '',
    );
    const dropped = raw.keys.length - valid.length;
    if (dropped) warnings.push(`${dropped} API key(s) were left out (incomplete entries).`);
    // Backups hold plaintext keys; per-device encryption data never travels.
    backup.keys = valid.map(({ blob: _blob, undecryptable: _undecryptable, ...rest }) => rest);
  }

  if (Array.isArray(raw.bookmarks)) {
    const parsed = parseImport(JSON.stringify(raw.bookmarks));
    if ('items' in parsed) {
      backup.bookmarks = applyImport([], parsed.items, 'replace', 'json').bookmarks;
      if (parsed.rejected) warnings.push(`${parsed.rejected} bookmark(s) were left out (no title, or not an http/https link).`);
    } else if (raw.bookmarks.length > 0) {
      warnings.push('The bookmarks in this file could not be read, so they will not be restored.');
    } else {
      backup.bookmarks = [];
    }
  }

  if (typeof raw.themeId === 'string' && raw.themeId.trim()) backup.themeId = raw.themeId;

  if (typeof raw.customAccentColor === 'string' && raw.customAccentColor) {
    if (isHexColor(raw.customAccentColor)) backup.customAccentColor = raw.customAccentColor;
    else warnings.push('The saved accent color is not a valid hex color and was ignored.');
  }

  const themesRaw = typeof raw.customThemeJson === 'string' ? safeParse(raw.customThemeJson) : raw.customThemeJson;
  if (themesRaw !== undefined && themesRaw !== null && themesRaw !== '') {
    const checked = validateThemePresets(themesRaw);
    if ('error' in checked) warnings.push(`Custom themes were ignored: ${checked.error}`);
    else backup.customThemeJson = JSON.stringify(checked.presets, null, 2);
  }

  if (isObject(raw.preferences)) {
    const p = raw.preferences;
    const prefs: BackupPreferences = {};
    for (const key of ['defaultLaunchSearch', 'showScopeExplainer', 'showStartupScreen', 'showLoadingAnimation'] as const) {
      if (typeof p[key] === 'boolean') prefs[key] = p[key] as boolean;
    }
    if (Object.keys(prefs).length) backup.preferences = prefs;
  }

  const summary: BackupSummary = {
    exportedAt: backup.exportedAt,
    customTools: backup.customTools?.length ?? 0,
    keys: backup.keys?.length ?? 0,
    bookmarks: backup.bookmarks?.length ?? 0,
    customThemes: backup.customThemeJson ? (JSON.parse(backup.customThemeJson) as unknown[]).length : 0,
    hasTheme: !!backup.themeId,
    hasPreferences: !!backup.preferences,
    has: {
      customTools: !!backup.customTools,
      keys: !!backup.keys,
      bookmarks: !!backup.bookmarks,
      customThemes: !!backup.customThemeJson,
    },
  };

  const hasAnything = Object.keys(backup).some((k) => k !== 'exportedAt');
  if (!hasAnything) return { ok: false, error: 'This file has nothing LocalMind can restore (no tools, keys, bookmarks, themes or preferences).' };

  return { ok: true, backup, summary, warnings };
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** One short phrase per section a restore will replace, e.g. for a confirmation message. */
export function describeRestore(summary: BackupSummary): string[] {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const lines: string[] = [];
  if (summary.has.customTools) lines.push(plural(summary.customTools, 'custom tool'));
  if (summary.has.keys) lines.push(plural(summary.keys, 'API key'));
  if (summary.has.bookmarks) lines.push(plural(summary.bookmarks, 'bookmark'));
  if (summary.has.customThemes) lines.push(plural(summary.customThemes, 'custom theme'));
  if (summary.hasTheme) lines.push('selected theme');
  if (summary.hasPreferences) lines.push('preferences');
  return lines;
}
