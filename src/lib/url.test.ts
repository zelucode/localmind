import { describe, expect, it } from 'vitest';
import { toWebUrl } from './url';

describe('toWebUrl', () => {
  it('adds https:// to a bare address and keeps explicit http(s) links as typed', () => {
    expect(toWebUrl('example.com/tool')).toEqual({ ok: true, url: 'https://example.com/tool' });
    expect(toWebUrl('  http://example.com  ')).toEqual({ ok: true, url: 'http://example.com' });
    expect(toWebUrl('HTTPS://Example.com')).toEqual({ ok: true, url: 'HTTPS://Example.com' });
  });

  it('understands host:port as an address, not a scheme', () => {
    expect(toWebUrl('localhost:3000')).toEqual({ ok: true, url: 'https://localhost:3000' });
    expect(toWebUrl('example.com:8080/x')).toEqual({ ok: true, url: 'https://example.com:8080/x' });
    expect(toWebUrl('http://localhost:11434')).toEqual({ ok: true, url: 'http://localhost:11434' });
  });

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'ftp://example.com', 'mailto:a@b.com', 'chrome://settings'])(
    'refuses %s (the old code turned these into https://<junk>)',
    (bad) => {
      const r = toWebUrl(bad);
      expect(r.ok).toBe(false);
      expect('error' in r && r.error).toMatch(/http/);
    },
  );

  it('refuses empty text, spaces and things that are not website addresses', () => {
    expect(toWebUrl('')).toMatchObject({ ok: false });
    expect(toWebUrl('   ')).toMatchObject({ ok: false });
    expect(toWebUrl('my tool')).toMatchObject({ ok: false, error: expect.stringMatching(/spaces/) });
    expect(toWebUrl('justaword')).toMatchObject({ ok: false, error: expect.stringMatching(/website address/) });
    expect(toWebUrl('https://')).toMatchObject({ ok: false });
  });
});
