/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import { RELEASES } from './releases';
import pkg from '../../package.json';

// Files are read as raw text through Vite, the same way copy.test.ts does.
const files = import.meta.glob(
  ['../../CHANGELOG.md', '../../src-tauri/tauri.conf.json', '../../src-tauri/Cargo.toml', '../../src-tauri/Cargo.lock'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;
const root = (path: string) => files[`../../${path}`];

describe('release metadata', () => {
  it('uses the same version in package.json, tauri.conf.json, Cargo.toml and Cargo.lock', () => {
    const tauri = JSON.parse(root('src-tauri/tauri.conf.json'));
    const cargo = root('src-tauri/Cargo.toml').match(/^version = "([^"]+)"/m)?.[1];
    const lock = root('src-tauri/Cargo.lock').match(/name = "localmind"\r?\nversion = "([^"]+)"/)?.[1];
    expect(tauri.version).toBe(pkg.version);
    expect(cargo).toBe(pkg.version);
    expect(lock).toBe(pkg.version);
  });

  it('puts the running version first in the in-app release list', () => {
    expect(RELEASES[0].version).toBe(pkg.version);
  });

  it('has a changelog entry for every release in the list', () => {
    const changelog = root('CHANGELOG.md');
    for (const release of RELEASES) {
      expect(changelog).toContain(`## [${release.version}] - ${release.date}`);
    }
  });

  it('lists releases newest first with valid dates and at least one highlight', () => {
    const dates = RELEASES.map((r) => r.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const release of RELEASES) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.highlights.length).toBeGreaterThan(0);
    }
  });
});
