import { BookmarkCategory, ToolBookmark } from '../types';

export type TransferFormat = 'json' | 'html' | 'markdown' | 'csv';
export type ImportMode = 'merge' | 'replace' | 'skip';
export type ImportSource = 'json' | 'html' | 'csv';

/** A bookmark as read from a file: only `title` and `url` are guaranteed, anything else may be missing. */
export type ImportedBookmark = Partial<ToolBookmark> & { title: string; url: string };

export const BOOKMARK_CATEGORIES: BookmarkCategory[] = [
  'developer',
  'design',
  'converters',
  'ai-utilities',
  'productivity',
  'utilities',
  'security',
  'education',
  'media',
  'custom',
];

export const FORMAT_INFO: Record<TransferFormat, { ext: string; mime: string }> = {
  json: { ext: 'json', mime: 'application/json' },
  html: { ext: 'html', mime: 'text/html' },
  markdown: { ext: 'md', mime: 'text/markdown' },
  csv: { ext: 'csv', mime: 'text/csv' },
};

// ---- URLs ----

/** The trimmed URL if it is a web link (http/https), otherwise null. Rejects javascript:, file:, data: and the like. */
export function safeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

/** Key used to decide whether two bookmarks are the same link (case, trailing slash and #fragment don't matter). */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = '';
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '')}${u.search}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

// ---- Export ----

export function exportFilename(format: TransferFormat, filter: string, now = new Date()): string {
  return `localmind_bookmarks_${filter}_${now.toISOString().split('T')[0]}.${FORMAT_INFO[format].ext}`;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Quote a CSV cell. Text starting with = + - @ is prefixed with ' so a spreadsheet won't run it as a formula. */
function csvCell(value: string, text = true): string {
  let v = value ?? '';
  if (text && /^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
}

function escapeMd(text: string): string {
  return text.replace(/([\\[\]])/g, '\\$1');
}

export function exportBookmarks(items: ToolBookmark[], format: TransferFormat, now = new Date()): string {
  if (format === 'json') {
    return JSON.stringify(
      { app: 'LocalMind', version: 1, exportedAt: now.toISOString(), totalCount: items.length, bookmarks: items },
      null,
      2,
    );
  }

  if (format === 'html') {
    // Netscape bookmark format, readable by Chrome, Firefox, Safari, Edge and Arc.
    const stamp = Math.floor(now.getTime() / 1000);
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks - LocalMind</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${stamp}" LAST_MODIFIED="${stamp}">${escapeHtml('LocalMind & Developer Tools')}</H3>
    <DL><p>
`;
    for (const b of items) {
      const tags = (b.tags || []).join(',');
      html += `        <DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${stamp}" TAGS="${escapeHtml(tags)}">${escapeHtml(b.title)}</A>\n`;
      if (b.description) html += `        <DD>${escapeHtml(b.description)}\n`;
    }
    html += `    </DL><p>
</DL><p>`;
    return html;
  }

  if (format === 'markdown') {
    let md = `# LocalMind Bookmarks (${items.length} tools)\n\n`;
    md += `*Exported on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}*\n\n`;
    const byCategory: Record<string, ToolBookmark[]> = {};
    for (const b of items) (byCategory[b.category || 'other'] ??= []).push(b);
    for (const [cat, list] of Object.entries(byCategory)) {
      md += `## ${cat.toUpperCase()} (${list.length})\n\n`;
      for (const b of list) {
        const desc = (b.description || 'No description').replace(/\s*\n\s*/g, ' ');
        md += `- [**${escapeMd(b.title)}**](${b.url.replace(/\)/g, '%29')}) - ${desc}\n`;
        if (b.tags?.length) md += `  *Tags: \`${b.tags.join('`, `')}\`*\n`;
      }
      md += '\n';
    }
    return md;
  }

  const headers = ['Title', 'URL', 'Category', 'Is AI', 'Badge', 'Tags', 'Description', 'GitHub URL', 'Stars'];
  const rows = items.map((b) =>
    [
      csvCell(b.title),
      csvCell(b.url, false),
      csvCell(b.category),
      csvCell(b.isAi ? 'true' : 'false', false),
      csvCell(b.freeTierBadge || ''),
      csvCell((b.tags || []).join(', ')),
      csvCell(b.description || ''),
      csvCell(b.githubUrl || '', false),
      csvCell(b.stars ? String(b.stars) : '0', false),
    ].join(','),
  );
  return [headers.map((h) => csvCell(h, false)).join(','), ...rows].join('\n');
}

// ---- Import: parsing ----

export type ParseResult =
  | { ok: true; source: ImportSource; items: ImportedBookmark[]; rejected: number }
  | { ok: false; error: string };

const asString = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const asTags = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string' && t.trim() !== '').map((t) => t.trim()) : [];

function parseJsonBookmarks(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}` };
  }
  const list: unknown = Array.isArray(parsed) ? parsed : (parsed as { bookmarks?: unknown } | null)?.bookmarks;
  if (!Array.isArray(list)) {
    return { ok: false, error: 'JSON must be an array of bookmarks or an object with a "bookmarks" array.' };
  }

  const items: ImportedBookmark[] = [];
  let rejected = 0;
  for (const raw of list as Record<string, unknown>[]) {
    const url = safeHttpUrl(raw?.url ?? raw?.href);
    const title = asString(raw?.title ?? raw?.name);
    if (!url || !title) {
      rejected++;
      continue;
    }
    const item: ImportedBookmark = { title, url };
    const id = asString(raw.id);
    if (id) item.id = id;
    const description = asString(raw.description ?? raw.desc);
    if (description) item.description = description;
    if (BOOKMARK_CATEGORIES.includes(raw.category as BookmarkCategory)) item.category = raw.category as BookmarkCategory;
    if (typeof raw.isAi === 'boolean') item.isAi = raw.isAi;
    const badge = asString(raw.freeTierBadge);
    if (badge) item.freeTierBadge = badge;
    const tags = asTags(raw.tags);
    if (tags.length) item.tags = tags;
    if (typeof raw.isFavorite === 'boolean') item.isFavorite = raw.isFavorite;
    if (typeof raw.clickCount === 'number' && raw.clickCount > 0) item.clickCount = raw.clickCount;
    const createdAt = asString(raw.createdAt);
    if (createdAt) item.createdAt = createdAt;
    const notes = asString(raw.notes);
    if (notes) item.notes = notes;
    if (typeof raw.isCustom === 'boolean') item.isCustom = raw.isCustom;
    const github = safeHttpUrl(raw.githubUrl);
    if (github) item.githubUrl = github;
    if (typeof raw.stars === 'number' && raw.stars > 0) item.stars = raw.stars;
    const license = asString(raw.license);
    if (license) item.license = license;
    items.push(item);
  }
  return { ok: true, source: 'json', items, rejected };
}

function parseHtmlBookmarks(text: string): ParseResult {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const items: ImportedBookmark[] = [];
  let rejected = 0;
  doc.querySelectorAll('a[href]').forEach((a) => {
    const url = safeHttpUrl(a.getAttribute('href'));
    const title = a.textContent?.trim();
    if (!url || !title) {
      rejected++;
      return;
    }
    const item: ImportedBookmark = { title, url };
    const tagAttr = a.getAttribute('tags');
    const tags = tagAttr ? tagAttr.split(',').map((t) => t.trim()).filter(Boolean) : [];
    item.tags = Array.from(new Set(['imported', ...tags]));
    // Netscape format puts the description in a <DD> right after the <DT> that holds the link.
    const next = a.closest('dt')?.nextElementSibling;
    const description = next?.tagName === 'DD' ? next.textContent?.trim() : '';
    if (description) item.description = description;
    items.push(item);
  });
  return { ok: true, source: 'html', items, rejected };
}

/** Minimal RFC 4180 reader: quoted cells, doubled quotes, newlines inside quotes. */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else {
      cell += c;
    }
  }
  row.push(cell);
  if (row.some((v) => v !== '')) rows.push(row);
  return rows;
}

function parseCsvBookmarks(text: string): ParseResult {
  const rows = parseCsvRows(text);
  const header = rows[0]?.map((h) => h.trim().toLowerCase()) ?? [];
  const col = (name: string) => header.indexOf(name);
  const iTitle = col('title');
  const iUrl = col('url');
  if (iTitle < 0 || iUrl < 0) {
    return { ok: false, error: 'CSV needs a header row with at least "Title" and "URL" columns.' };
  }
  // Undo the ' we add on export to stop spreadsheets from running text that starts with = + - @.
  const clean = (v: string | undefined) => (v ?? '').trim().replace(/^'(?=[=+\-@\t\r])/, '');
  const cell = (r: string[], i: number) => (i >= 0 ? clean(r[i]) : '');

  const items: ImportedBookmark[] = [];
  let rejected = 0;
  for (const r of rows.slice(1)) {
    const url = safeHttpUrl(cell(r, iUrl));
    const title = cell(r, iTitle);
    if (!url || !title) {
      rejected++;
      continue;
    }
    const item: ImportedBookmark = { title, url };
    const category = cell(r, col('category')) as BookmarkCategory;
    if (BOOKMARK_CATEGORIES.includes(category)) item.category = category;
    const isAi = cell(r, col('is ai')).toLowerCase();
    if (isAi === 'true' || isAi === 'false') item.isAi = isAi === 'true';
    const badge = cell(r, col('badge'));
    if (badge) item.freeTierBadge = badge;
    const tags = cell(r, col('tags')).split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    if (tags.length) item.tags = tags;
    const description = cell(r, col('description'));
    if (description) item.description = description;
    const github = safeHttpUrl(cell(r, col('github url')));
    if (github) item.githubUrl = github;
    const stars = Number(cell(r, col('stars')));
    if (Number.isFinite(stars) && stars > 0) item.stars = stars;
    items.push(item);
  }
  return { ok: true, source: 'csv', items, rejected };
}

/** Detect JSON, browser HTML or CSV and read it. Never throws. */
export function parseImport(text: string): ParseResult {
  const trimmed = text.replace(/^﻿/, '').trim();
  if (!trimmed) return { ok: false, error: 'Nothing to import.' };

  let result: ParseResult;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) result = parseJsonBookmarks(trimmed);
  else if (/<a\s[^>]*href\s*=/i.test(trimmed)) result = parseHtmlBookmarks(trimmed);
  else if (/^[^\n]*\burl\b[^\n]*,|,[^\n]*\burl\b/i.test(trimmed.split(/\r?\n/, 1)[0])) result = parseCsvBookmarks(trimmed);
  else {
    return { ok: false, error: 'Unrecognized format. Use a LocalMind JSON backup, a browser bookmarks HTML file, or a CSV with Title and URL columns.' };
  }

  if (result.ok && result.items.length === 0) {
    return {
      ok: false,
      error: `No valid bookmarks found${result.rejected ? ` (${result.rejected} entries rejected: each needs a title and an http(s) URL)` : ''}.`,
    };
  }
  return result;
}

// ---- Import: applying ----

export interface ImportResult {
  bookmarks: ToolBookmark[];
  added: number;
  /** Existing bookmarks changed by the import. */
  updated: number;
  /** Imported entries not used (duplicates in skip mode, or unchanged by a browser import). */
  skipped: number;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

let idCounter = 0;
function newId(): string {
  return `bm-import-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
}

function toBookmark(b: ImportedBookmark, source: ImportSource, usedIds: Set<string>): ToolBookmark {
  let id = b.id && !usedIds.has(b.id) ? b.id : newId();
  while (usedIds.has(id)) id = newId();
  usedIds.add(id);
  return {
    ...b,
    id,
    description: b.description ?? (source === 'html' ? 'Imported from browser bookmarks' : ''),
    category: b.category ?? 'utilities',
    isAi: b.isAi ?? false,
    freeTierBadge: b.freeTierBadge ?? (source === 'html' ? 'Browser Bookmark' : 'Free Web Tool'),
    tags: b.tags ?? [],
    createdAt: b.createdAt ?? today(),
  };
}

/** How many imported entries are new and how many are already in the list (same link), without changing anything. */
export function previewImport(existing: ToolBookmark[], imported: ImportedBookmark[]): { fresh: number; duplicates: number } {
  const known = new Set(existing.map((b) => normalizeUrl(b.url)));
  let fresh = 0;
  let duplicates = 0;
  for (const b of imported) {
    const key = normalizeUrl(b.url);
    if (known.has(key)) duplicates++;
    else {
      fresh++;
      known.add(key);
    }
  }
  return { fresh, duplicates };
}

/**
 * Combine imported bookmarks with the current list.
 * - replace: the import becomes the whole list.
 * - skip: only links not already present are added.
 * - merge: new links are added; for a link already present (same id or same URL) a JSON/CSV import fills in
 *   whatever the file has (non-empty values only) and keeps favorites and click counts. A browser HTML import
 *   never changes an existing bookmark, because it carries no metadata worth trusting.
 */
export function applyImport(
  existing: ToolBookmark[],
  imported: ImportedBookmark[],
  mode: ImportMode,
  source: ImportSource = 'json',
): ImportResult {
  const usedIds = new Set<string>(mode === 'replace' ? [] : existing.map((b) => b.id));

  if (mode === 'replace') {
    const seen = new Set<string>();
    const list: ToolBookmark[] = [];
    let skipped = 0;
    for (const b of imported) {
      const key = normalizeUrl(b.url);
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);
      list.push(toBookmark(b, source, usedIds));
    }
    return { bookmarks: list, added: list.length, updated: 0, skipped };
  }

  const result = [...existing];
  const byUrl = new Map(result.map((b, i) => [normalizeUrl(b.url), i]));
  const byId = new Map(result.map((b, i) => [b.id, i]));
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const b of imported) {
    const idx = (b.id !== undefined ? byId.get(b.id) : undefined) ?? byUrl.get(normalizeUrl(b.url));
    if (idx === undefined) {
      const created = toBookmark(b, source, usedIds);
      result.push(created);
      byUrl.set(normalizeUrl(created.url), result.length - 1);
      byId.set(created.id, result.length - 1);
      added++;
      continue;
    }
    if (mode === 'skip' || source === 'html') {
      skipped++;
      continue;
    }
    const current = result[idx];
    const next: ToolBookmark = {
      ...current,
      title: b.title,
      url: b.url,
      ...(b.description ? { description: b.description } : {}),
      ...(b.category ? { category: b.category } : {}),
      ...(b.freeTierBadge ? { freeTierBadge: b.freeTierBadge } : {}),
      ...(b.tags?.length ? { tags: Array.from(new Set([...current.tags, ...b.tags])) } : {}),
      ...(b.notes ? { notes: b.notes } : {}),
      ...(b.githubUrl ? { githubUrl: b.githubUrl } : {}),
      ...(b.stars ? { stars: b.stars } : {}),
      ...(b.license ? { license: b.license } : {}),
      isFavorite: current.isFavorite || b.isFavorite || undefined,
      clickCount: Math.max(current.clickCount || 0, b.clickCount || 0) || undefined,
    };
    result[idx] = next;
    updated++;
  }
  return { bookmarks: result, added, updated, skipped };
}
