import { describe, expect, it } from 'vitest';
import { AITool, StoredApiKey, ToolBookmark } from '../types';
import { defaultThemePresets } from '../theme';
import {
  BackupInput,
  ENCRYPTED_BACKUP_FORMAT,
  backupFilename,
  buildBackup,
  describeRestore,
  isEncryptedBackup,
  parseBackup,
  passphraseProblem,
} from './backup';

const NOW = new Date('2026-10-06T12:00:00Z');

const tool = { id: 't1', name: 'My Tool', url: 'https://tool.example.com', isCustom: true } as AITool;
const key: StoredApiKey = {
  id: 'k1',
  provider: 'groq',
  providerName: 'Groq Cloud',
  key: 'gsk_secret',
  label: 'My Groq',
  createdAt: '2026-01-01',
  freeTierNotes: '',
  getKeyUrl: '',
  lastTestedStatus: 'unknown',
  blob: 'enc:v1:abc',
};
const bookmark: ToolBookmark = {
  id: 'b1',
  title: 'Alpha',
  url: 'https://alpha.example.com',
  description: 'd',
  category: 'developer',
  isAi: false,
  freeTierBadge: 'Free',
  tags: [],
  createdAt: '2026-01-01',
  notes: 'keep me',
};

const input: BackupInput = {
  customTools: [tool],
  favIds: ['t1'],
  keys: [key],
  bookmarks: [bookmark],
  themeId: 'pastel-dusk',
  customAccentColor: '#ff0000',
  customThemeJson: JSON.stringify(defaultThemePresets.slice(0, 2)),
  preferences: { defaultLaunchSearch: true, showScopeExplainer: false, showStartupScreen: true, showLoadingAnimation: false },
};

const ok = (text: string) => {
  const r = parseBackup(text);
  if ('error' in r) throw new Error(r.error);
  return r;
};

describe('buildBackup', () => {
  it('leaves API keys out unless they are asked for', () => {
    const text = buildBackup(input, { includeKeys: false }, NOW);
    expect(text).not.toContain('gsk_secret');
    expect(JSON.parse(text).keys).toBeUndefined();
  });

  it('writes keys as plain text without per-device encryption data when asked', () => {
    const data = JSON.parse(buildBackup(input, { includeKeys: true }, NOW));
    expect(data.keys).toHaveLength(1);
    expect(data.keys[0].key).toBe('gsk_secret');
    expect(data.keys[0].blob).toBeUndefined();
  });

  it('includes bookmarks, themes and every preference (the old backup left bookmarks and startup prefs out)', () => {
    const data = JSON.parse(buildBackup(input, { includeKeys: false }, NOW));
    expect(data).toMatchObject({ app: 'LocalMind', version: 2, exportedAt: NOW.toISOString(), themeId: 'pastel-dusk', customAccentColor: '#ff0000' });
    expect(data.bookmarks[0].notes).toBe('keep me');
    expect(data.preferences).toEqual(input.preferences);
    expect(data.customThemeJson).toBe(input.customThemeJson);
  });

  it('names the file after LocalMind and the date', () => {
    expect(backupFilename(NOW)).toBe('localmind-backup-2026-10-06.json');
  });
});

describe('parseBackup', () => {
  it('round-trips a full backup', () => {
    const r = ok(buildBackup(input, { includeKeys: true }, NOW));
    expect(r.backup.customTools).toEqual([tool]);
    expect(r.backup.favIds).toEqual(['t1']);
    expect(r.backup.keys).toHaveLength(1);
    expect(r.backup.keys![0].blob).toBeUndefined();
    expect(r.backup.bookmarks![0]).toMatchObject({ id: 'b1', title: 'Alpha', notes: 'keep me' });
    expect(r.backup.themeId).toBe('pastel-dusk');
    expect(r.backup.customAccentColor).toBe('#ff0000');
    expect(JSON.parse(r.backup.customThemeJson!)).toHaveLength(2);
    expect(r.backup.preferences).toEqual(input.preferences);
    expect(r.summary).toMatchObject({ customTools: 1, keys: 1, bookmarks: 1, customThemes: 2, hasTheme: true, hasPreferences: true });
    expect(r.warnings).toEqual([]);
  });

  it('only reports the sections that are in the file, so a restore can leave the rest alone', () => {
    const r = ok(buildBackup(input, { includeKeys: false }, NOW));
    expect(r.backup.keys).toBeUndefined();
    expect(r.summary.has).toEqual({ customTools: true, keys: false, bookmarks: true, customThemes: true });
    expect(describeRestore(r.summary)).not.toContain('API key');
    expect(describeRestore(r.summary).join(' ')).not.toMatch(/API key/);
  });

  it('still reads a version 1 backup (no bookmarks, themes as a JSON string)', () => {
    const v1 = JSON.stringify({ version: 1, exportedAt: 'x', customTools: [tool], keys: [key], favIds: [], themeId: 'nord', preferences: { defaultLaunchSearch: false } });
    const r = ok(v1);
    expect(r.backup.bookmarks).toBeUndefined();
    expect(r.summary).toMatchObject({ customTools: 1, keys: 1 });
  });

  it('says so when the file is not a backup, instead of reporting success', () => {
    expect('error' in parseBackup('{}')).toBe(true);
    expect('error' in parseBackup('[]')).toBe(true);
    expect('error' in parseBackup('{"foo": 1}')).toBe(true);
    const bad = parseBackup('{not json');
    expect('error' in bad && bad.error).toMatch(/not a valid JSON/);
  });

  it('drops unsafe or incomplete entries and tells the user', () => {
    const r = ok(
      JSON.stringify({
        customTools: [tool, { id: 'x', name: 'bad', url: 'javascript:alert(1)' }, { name: 'no id', url: 'https://a.com' }],
        keys: [key, { id: 'k2', provider: 'groq', key: '' }],
        bookmarks: [bookmark, { title: 'evil', url: 'file:///etc/passwd' }],
        customAccentColor: 'url(javascript:1)',
        customThemeJson: JSON.stringify([{ id: 'broken' }]),
      }),
    );
    expect(r.backup.customTools).toHaveLength(1);
    expect(r.backup.keys).toHaveLength(1);
    expect(r.backup.bookmarks).toHaveLength(1);
    expect(r.backup.customAccentColor).toBeUndefined();
    expect(r.backup.customThemeJson).toBeUndefined();
    expect(r.warnings.join('\n')).toMatch(/custom tool/);
    expect(r.warnings.join('\n')).toMatch(/API key/);
    expect(r.warnings.join('\n')).toMatch(/bookmark/);
    expect(r.warnings.join('\n')).toMatch(/accent color/);
    expect(r.warnings.join('\n')).toMatch(/Custom themes were ignored/);
  });

  it('accepts custom themes given as an array as well as a JSON string', () => {
    const r = ok(JSON.stringify({ customThemeJson: defaultThemePresets.slice(0, 1) }));
    expect(r.summary.customThemes).toBe(1);
  });

  it('describes what a restore replaces', () => {
    const r = ok(buildBackup(input, { includeKeys: true }, NOW));
    expect(describeRestore(r.summary)).toEqual(['1 custom tool', '1 API key', '1 bookmark', '2 custom themes', 'selected theme', 'preferences']);
  });
});

describe('passphrase-protected backups', () => {
  it('recognises a protected file by its format marker and nothing else', () => {
    expect(isEncryptedBackup(JSON.stringify({ format: ENCRYPTED_BACKUP_FORMAT, version: 1 }))).toBe(true);
    expect(isEncryptedBackup(JSON.stringify({ version: 2, bookmarks: [] }))).toBe(false);
    expect(isEncryptedBackup('not json')).toBe(false);
    expect(isEncryptedBackup('null')).toBe(false);
    expect(isEncryptedBackup('[]')).toBe(false);
  });

  it('names a protected file differently from a plain one', () => {
    expect(backupFilename(NOW)).toBe('localmind-backup-2026-10-06.json');
    expect(backupFilename(NOW, true)).toBe('localmind-backup-2026-10-06-encrypted.json');
  });

  it('checks a new passphrase for length (in characters) and for a matching confirmation', () => {
    expect(passphraseProblem('short', 'short')).toMatch(/at least 8/);
    expect(passphraseProblem('éééééé', 'éééééé')).toMatch(/at least 8/); // 6 characters, 12 bytes
    expect(passphraseProblem('éééééééé', 'éééééééé')).toBeNull();
    expect(passphraseProblem('a'.repeat(257), 'a'.repeat(257))).toMatch(/at most 256/);
    expect(passphraseProblem('long enough one', 'long enough two')).toMatch(/do not match/);
    expect(passphraseProblem('long enough', 'long enough')).toBeNull();
  });

  it('a protected file is not mistaken for a readable backup', () => {
    const r = parseBackup(JSON.stringify({ format: ENCRYPTED_BACKUP_FORMAT, version: 1, data: 'x' }));
    expect(r.ok).toBe(false);
  });
});
