import { describe, expect, it } from 'vitest';
import { POPULAR_API_PROVIDERS, PROVIDERS, PROVIDER_PRESETS, RATE_LIMIT_DATA } from './providers';

const VAULT_IDS = ['gemini', 'openrouter', 'groq', 'deepseek', 'openai', 'anthropic', 'mistral'];

describe('provider data', () => {
  it('has unique ids and https (or local http) key and docs URLs', () => {
    expect(new Set(PROVIDERS.map((p) => p.id)).size).toBe(PROVIDERS.length);
    for (const p of PROVIDERS) {
      expect(p.getKeyUrl, p.id).toMatch(/^https?:\/\//);
      expect(p.docsUrl, p.id).toMatch(/^https?:\/\//);
    }
  });

  it('only marks a row as reviewed with a YYYY-MM month', () => {
    for (const p of PROVIDERS) {
      if (p.reviewed) expect(p.reviewed, p.id).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    }
  });

  it('every vault provider id is a valid StoredApiKey provider', () => {
    for (const v of POPULAR_API_PROVIDERS) expect(VAULT_IDS).toContain(v.provider);
  });

  it('feeds the matrix, exporter and vault from the same rows (name, key URL)', () => {
    for (const row of RATE_LIMIT_DATA) {
      const src = PROVIDERS.find((p) => p.id === row.id)!;
      expect([row.provider, row.getKeyUrl]).toEqual([src.name, src.getKeyUrl]);
    }
    for (const preset of PROVIDER_PRESETS) {
      const src = PROVIDERS.find((p) => p.id === preset.id)!;
      expect([preset.name, preset.getKeyUrl]).toEqual([src.name, src.getKeyUrl]);
    }
    for (const v of POPULAR_API_PROVIDERS) {
      const src = PROVIDERS.find((p) => p.id === v.provider)!;
      expect([v.name, v.getKeyUrl, v.freeQuota]).toEqual([src.name, src.getKeyUrl, src.freeQuota]);
    }
  });

  it('every matrix row can open the exporter (has a preset)', () => {
    for (const row of RATE_LIMIT_DATA) expect(PROVIDER_PRESETS.map((p) => p.id)).toContain(row.id);
  });

  it('has a default model that is in its own model list', () => {
    for (const p of PROVIDER_PRESETS) expect(p.availableModels.map((m) => m.id), p.id).toContain(p.defaultModel);
  });

  it('does not describe a paid provider as free', () => {
    const deepseek = POPULAR_API_PROVIDERS.find((v) => v.provider === 'deepseek')!;
    expect(deepseek.isFree).toBe(false);
    expect(deepseek.freeQuota).not.toMatch(/5M|free tokens/i);
  });
});
