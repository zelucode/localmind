import { describe, expect, it } from 'vitest';
import { ToolBookmark } from '../types';
import {
  applyImport,
  exportBookmarks,
  exportFilename,
  normalizeUrl,
  parseCsvRows,
  parseImport,
  previewImport,
  safeHttpUrl,
} from './bookmarkTransfer';

const NOW = new Date('2026-10-06T12:00:00Z');

const bm = (over: Partial<ToolBookmark> = {}): ToolBookmark => ({
  id: 'a',
  title: 'Alpha',
  url: 'https://alpha.example.com',
  description: 'The alpha tool',
  category: 'developer',
  isAi: false,
  freeTierBadge: 'Free Web Tool',
  tags: ['one', 'two'],
  createdAt: '2026-01-01',
  ...over,
});

const ok = (text: string) => {
  const r = parseImport(text);
  if ('error' in r) throw new Error(r.error);
  return r;
};

describe('safeHttpUrl / normalizeUrl', () => {
  it('accepts only http(s) links', () => {
    expect(safeHttpUrl(' https://a.com/x ')).toBe('https://a.com/x');
    expect(safeHttpUrl('http://a.com')).toBe('http://a.com');
    for (const bad of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hi', 'chrome://settings', 'a.com', '', null, 5]) {
      expect(safeHttpUrl(bad), String(bad)).toBeNull();
    }
  });

  it('treats case, trailing slash and fragments as the same link', () => {
    expect(normalizeUrl('https://Example.com/Tool/#top')).toBe(normalizeUrl('https://example.com/Tool'));
    expect(normalizeUrl('https://a.com/x?q=1')).not.toBe(normalizeUrl('https://a.com/x'));
  });
});

describe('exportBookmarks', () => {
  const items = [
    bm({ title: 'Tom & "Jerry" <tool>', description: 'Line one\nline two', githubUrl: 'https://github.com/x/y', stars: 1200 }),
  ];

  it('json is a valid backup that keeps every field', () => {
    const out = JSON.parse(exportBookmarks(items, 'json', NOW));
    expect(out).toMatchObject({ app: 'LocalMind', version: 1, totalCount: 1, exportedAt: NOW.toISOString() });
    expect(out.bookmarks[0]).toEqual(items[0]);
  });

  it('html escapes markup and is a Netscape bookmark file', () => {
    const out = exportBookmarks(items, 'html', NOW);
    expect(out.startsWith('<!DOCTYPE NETSCAPE-Bookmark-file-1>')).toBe(true);
    expect(out).toContain('Tom &amp; &quot;Jerry&quot; &lt;tool&gt;');
    expect(out).not.toContain('<tool>');
  });

  it('markdown escapes brackets in titles and keeps each entry on one line', () => {
    const out = exportBookmarks([bm({ title: 'a [b] c', description: 'x\ny' })], 'markdown', NOW);
    expect(out).toContain('[**a \\[b\\] c**](https://alpha.example.com) - x y');
  });

  it('csv quotes every cell and defuses spreadsheet formulas', () => {
    const out = exportBookmarks([bm({ title: '=HYPERLINK("http://evil")', description: 'a,b' })], 'csv', NOW);
    const [header, row] = parseCsvRows(out);
    expect(header[0]).toBe('Title');
    expect(row[0]).toBe(`'=HYPERLINK("http://evil")`);
    expect(row[6]).toBe('a,b');
  });

  it('names files after LocalMind with the date', () => {
    expect(exportFilename('csv', 'all', NOW)).toBe('localmind_bookmarks_all_2026-10-06.csv');
    expect(exportFilename('markdown', 'favorites', NOW)).toBe('localmind_bookmarks_favorites_2026-10-06.md');
  });
});

describe('parseImport: JSON', () => {
  it('round-trips an export without losing notes, click counts, custom flag or license', () => {
    const original = bm({
      notes: 'my note',
      clickCount: 7,
      isCustom: true,
      license: 'MIT',
      isFavorite: true,
      stars: 10,
      githubUrl: 'https://github.com/a/b',
    });
    const r = ok(exportBookmarks([original], 'json', NOW));
    expect(r.source).toBe('json');
    expect(r.items[0]).toEqual(original);
  });

  it('accepts a bare array and the legacy href/name/desc keys', () => {
    const r = ok(JSON.stringify([{ name: 'X', href: 'https://x.com', desc: 'd' }]));
    expect(r.items[0]).toMatchObject({ title: 'X', url: 'https://x.com', description: 'd' });
  });

  it('rejects javascript: and non-web links, counting them', () => {
    const r = ok(
      JSON.stringify([
        { title: 'ok', url: 'https://ok.com' },
        { title: 'bad', url: 'javascript:alert(1)' },
        { title: 'f', url: 'file:///x' },
        { url: 'https://notitle.com' },
      ]),
    );
    expect(r.items.map((i) => i.title)).toEqual(['ok']);
    expect(r.rejected).toBe(3);
  });

  it('drops unknown categories instead of hiding the bookmark in a category nobody can open', () => {
    const r = ok(JSON.stringify([{ title: 'a', url: 'https://a.com', category: 'nonsense' }]));
    expect(r.items[0].category).toBeUndefined();
  });

  it('reports the real JSON syntax error', () => {
    const r = parseImport('{"bookmarks": [');
    expect(r).toMatchObject({ ok: false });
    expect('error' in r && r.error).toMatch(/^Invalid JSON/);
  });

  it('explains wrong shapes and empty results', () => {
    expect(parseImport('{"foo": 1}')).toMatchObject({ ok: false });
    const none = parseImport('[{"title":"x","url":"javascript:1"}]');
    expect('error' in none && none.error).toMatch(/No valid bookmarks.*1 entries rejected/);
  });
});

describe('parseImport: browser HTML', () => {
  const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
<DT><H3>Folder</H3>
<DL><p>
<DT><A HREF="https://a.com/x" ADD_DATE="1" ICON="data:image/png;base64,AAAA">Tom &amp; Jerry</A>
<DT><A HREF="javascript:alert(1)">evil</A>
<DT><A HREF="chrome://settings">settings</A>
<DT><A HREF="https://b.com" TAGS="x, y">B tool</A>
<DD>B description
</DL><p>
</DL><p>`;

  it('reads titles with entities decoded and drops non-web links', () => {
    const r = ok(html);
    expect(r.source).toBe('html');
    expect(r.items.map((i) => i.title)).toEqual(['Tom & Jerry', 'B tool']);
    expect(r.rejected).toBe(2);
  });

  it('reads TAGS and the description line', () => {
    const b = ok(html).items[1];
    expect(b.tags).toEqual(['imported', 'x', 'y']);
    expect(b.description).toBe('B description');
  });

  it('round-trips our own HTML export with title, description and tags', () => {
    const original = bm({ title: 'Tom & Jerry', description: 'A "quoted" <desc>', tags: ['t1', 't2'] });
    const back = ok(exportBookmarks([original], 'html', NOW)).items[0];
    expect(back).toMatchObject({ title: 'Tom & Jerry', url: original.url, description: 'A "quoted" <desc>' });
    expect(back.tags).toEqual(['imported', 't1', 't2']);
  });
});

describe('parseImport: CSV', () => {
  it('round-trips our own CSV export, including commas, quotes, newlines and formula-prefixed text', () => {
    const original = bm({
      title: '=SUM(A1)',
      description: 'He said "hi",\nthen left',
      tags: ['a', 'b'],
      isAi: true,
      githubUrl: 'https://github.com/a/b',
      stars: 5,
      freeTierBadge: 'Free',
    });
    const r = ok(exportBookmarks([original], 'csv', NOW));
    expect(r.source).toBe('csv');
    expect(r.items[0]).toMatchObject({
      title: '=SUM(A1)',
      url: original.url,
      category: 'developer',
      isAi: true,
      description: 'He said "hi",\nthen left',
      tags: ['a', 'b'],
      githubUrl: 'https://github.com/a/b',
      stars: 5,
      freeTierBadge: 'Free',
    });
  });

  it('accepts a minimal Title,URL file with a BOM and CRLF', () => {
    const r = ok('﻿title,url\r\nA,https://a.com\r\nB,https://b.com\r\n');
    expect(r.items.map((i) => i.title)).toEqual(['A', 'B']);
  });

  it('asks for the columns it needs', () => {
    expect(parseImport('name,link\nA,https://a.com').ok).toBe(false);
  });
});

describe('parseImport: other', () => {
  it('rejects empty and unknown text', () => {
    expect(parseImport('   ')).toMatchObject({ ok: false });
    expect(parseImport('just some words')).toMatchObject({ ok: false });
  });
});

describe('applyImport', () => {
  const existing = [
    bm({ id: 'a', url: 'https://alpha.example.com', isFavorite: true, clickCount: 5, notes: 'mine' }),
    bm({ id: 'b', title: 'Beta', url: 'https://beta.example.com' }),
  ];

  it('merge adds new links and never duplicates an updated one (regression: updates used to appear twice)', () => {
    const r = applyImport(
      existing,
      [
        { title: 'Alpha 2', url: 'https://ALPHA.example.com/', description: 'new desc' },
        { title: 'Gamma', url: 'https://gamma.example.com' },
      ],
      'merge',
    );
    expect(r.bookmarks).toHaveLength(3);
    expect(r).toMatchObject({ added: 1, updated: 1, skipped: 0 });
    const a = r.bookmarks.find((b) => b.id === 'a')!;
    expect(a).toMatchObject({ title: 'Alpha 2', description: 'new desc', isFavorite: true, clickCount: 5, notes: 'mine' });
    expect(new Set(r.bookmarks.map((b) => b.id)).size).toBe(3);
  });

  it('merge does not blank existing fields with the empty ones of a sparse file', () => {
    const r = applyImport(existing, [{ title: 'Alpha', url: 'https://alpha.example.com' }], 'merge');
    expect(r.bookmarks[0]).toMatchObject({
      description: 'The alpha tool',
      category: 'developer',
      tags: ['one', 'two'],
      freeTierBadge: 'Free Web Tool',
    });
  });

  it('merge unions tags and keeps the larger click count and favorites', () => {
    const r = applyImport(
      existing,
      [{ title: 'Alpha', url: 'https://alpha.example.com', tags: ['two', 'three'], clickCount: 9, isFavorite: false }],
      'merge',
    );
    expect(r.bookmarks[0]).toMatchObject({ tags: ['one', 'two', 'three'], clickCount: 9, isFavorite: true });
  });

  it('merge matches by id so a restored backup can bring back an edited link', () => {
    const r = applyImport(existing, [{ id: 'a', title: 'Alpha', url: 'https://alpha-new.example.com' }], 'merge');
    expect(r.bookmarks).toHaveLength(2);
    expect(r.bookmarks[0].url).toBe('https://alpha-new.example.com');
  });

  it('a browser HTML import never overwrites an existing bookmark (regression: it replaced descriptions with a placeholder)', () => {
    const r = applyImport(
      existing,
      [
        { title: 'alpha from chrome', url: 'https://alpha.example.com', tags: ['imported'], description: 'Imported' },
        { title: 'New', url: 'https://new.example.com', tags: ['imported'] },
      ],
      'merge',
      'html',
    );
    expect(r.bookmarks[0]).toEqual(existing[0]);
    expect(r).toMatchObject({ added: 1, updated: 0, skipped: 1 });
    expect(r.bookmarks[2]).toMatchObject({
      category: 'utilities',
      freeTierBadge: 'Browser Bookmark',
      description: 'Imported from browser bookmarks',
    });
  });

  it('skip only adds links that are not there yet', () => {
    const r = applyImport(
      existing,
      [
        { title: 'X', url: 'https://alpha.example.com', description: 'changed' },
        { title: 'Y', url: 'https://y.example.com' },
      ],
      'skip',
    );
    expect(r).toMatchObject({ added: 1, updated: 0, skipped: 1 });
    expect(r.bookmarks[0]).toEqual(existing[0]);
  });

  it('replace swaps the whole list and drops duplicate links inside the file', () => {
    const r = applyImport(
      existing,
      [
        { title: 'Only', url: 'https://only.example.com' },
        { title: 'Only again', url: 'https://only.example.com/' },
      ],
      'replace',
    );
    expect(r.bookmarks.map((b) => b.title)).toEqual(['Only']);
    expect(r).toMatchObject({ added: 1, updated: 0, skipped: 1 });
  });

  it('gives imported items ids that cannot collide with existing ones or each other', () => {
    const r = applyImport(
      existing,
      [
        { id: 'a', title: 'Z', url: 'https://z.example.com' },
        { id: 'dup', title: 'D1', url: 'https://d1.example.com' },
        { id: 'dup', title: 'D2', url: 'https://d2.example.com' },
      ],
      'skip',
    );
    expect(new Set(r.bookmarks.map((b) => b.id)).size).toBe(r.bookmarks.length);
  });

  it('previewImport counts new versus already-present links without changing anything', () => {
    expect(
      previewImport(existing, [
        { title: 'a', url: 'https://alpha.example.com/' },
        { title: 'n', url: 'https://n.com' },
        { title: 'n2', url: 'https://n.com' },
      ]),
    ).toEqual({ fresh: 1, duplicates: 2 });
  });
});
