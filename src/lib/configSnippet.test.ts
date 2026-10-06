import { describe, expect, it } from 'vitest';
import { PROVIDER_PRESETS } from '../data/providers';
import { TargetToolId, buildConfigSnippet, joinUrl } from './configSnippet';

const TOOLS: TargetToolId[] = ['continue', 'cline', 'cursor', 'aider', 'windsurf', 'python', 'typescript', 'curl'];
const preset = (id: string) => PROVIDER_PRESETS.find((p) => p.id === id)!;
const build = (toolId: TargetToolId, providerId: string, key = 'SECRET', model?: string) => {
  const provider = preset(providerId);
  return buildConfigSnippet({ toolId, provider, model: model ?? provider.defaultModel, key });
};

describe('joinUrl', () => {
  it('uses exactly one slash whatever the base looks like', () => {
    expect(joinUrl('https://a.com/v1', 'chat/completions')).toBe('https://a.com/v1/chat/completions');
    expect(joinUrl('https://a.com/v1/', 'chat/completions')).toBe('https://a.com/v1/chat/completions');
    expect(joinUrl('https://a.com/v1/', '/chat/completions')).toBe('https://a.com/v1/chat/completions');
  });
});

describe('buildConfigSnippet', () => {
  it('produces a non-empty snippet containing the key and model for every tool and provider', () => {
    for (const provider of PROVIDER_PRESETS) {
      for (const tool of TOOLS) {
        const out = build(tool, provider.id);
        // Continue talks to a local Ollama without a key, so none is written.
        if (!(tool === 'continue' && provider.id === 'ollama')) {
          expect(out, `${tool}/${provider.id}`).toContain('SECRET');
        }
        expect(out, `${tool}/${provider.id}`).toContain(provider.defaultModel);
      }
    }
  });

  it('builds a valid cURL URL for every provider (no "v1chat" glue)', () => {
    for (const provider of PROVIDER_PRESETS) {
      const out = build('curl', provider.id);
      expect(out).toMatch(/curl \S+\/chat\/completions /);
      expect(out).not.toMatch(/v1chat|beta\/openaichat|azure\.comchat/);
    }
    expect(build('curl', 'groq')).toContain('curl https://api.groq.com/openai/v1/chat/completions');
    expect(build('curl', 'gemini')).toContain('/v1beta/openai/chat/completions');
  });

  describe('Continue', () => {
    const json = (out: string) => JSON.parse(out.slice(out.indexOf('{')));

    it('emits valid JSON after the comment line', () => {
      for (const provider of PROVIDER_PRESETS) {
        expect(() => json(build('continue', provider.id)), provider.id).not.toThrow();
      }
    });

    it('never pulls in a Groq key when another provider is selected', () => {
      const out = build('continue', 'gemini');
      expect(out).not.toMatch(/groq/i);
      expect(json(out).tabAutocompleteModel).toBeUndefined();
    });

    it('adds the Groq autocomplete model only for Groq, reusing the same key', () => {
      const cfg = json(build('continue', 'groq'));
      expect(cfg.tabAutocompleteModel).toMatchObject({ model: 'llama-3.1-8b-instant', apiKey: 'SECRET' });
    });

    it('uses native providers for Gemini/Ollama and apiBase for the rest; Ollama gets no key', () => {
      expect(json(build('continue', 'gemini')).models[0]).toMatchObject({ provider: 'gemini' });
      expect(json(build('continue', 'gemini')).models[0].apiBase).toBeUndefined();
      expect(json(build('continue', 'ollama')).models[0].apiKey).toBeUndefined();
      expect(json(build('continue', 'openrouter')).models[0]).toMatchObject({
        provider: 'openai',
        apiBase: 'https://openrouter.ai/api/v1',
      });
    });

    it('escapes quotes in a pasted key instead of breaking the JSON', () => {
      expect(() => json(build('continue', 'groq', 'a"b'))).not.toThrow();
    });
  });

  describe('Aider', () => {
    it('uses the provider prefix and its own env var for natively supported providers', () => {
      const out = build('aider', 'groq');
      expect(out).toContain('export GROQ_API_KEY="SECRET"');
      expect(out).toContain('aider --model groq/llama-3.3-70b-versatile');
      expect(out).not.toContain('--openai-api-base');
    });

    it('uses the OpenAI-compatible flags for everything else, without a stray env export', () => {
      const out = build('aider', 'omniroute');
      expect(out).toContain('--openai-api-base http://localhost:8000/v1');
      expect(out).toContain('--model openai/gemini-2.5-flash');
      expect(out).not.toContain('export OPENAI_API_KEY');
    });
  });

  it('embeds a placeholder key verbatim', () => {
    expect(build('python', 'groq', 'YOUR_GROQ_API_KEY')).toContain('api_key="YOUR_GROQ_API_KEY"');
  });

  it('uses the Gemini SDK for Gemini and the OpenAI SDK elsewhere', () => {
    expect(build('python', 'gemini')).toContain('google-genai');
    expect(build('typescript', 'gemini')).toContain('@google/genai');
    expect(build('python', 'groq')).toContain('from openai import OpenAI');
    expect(build('typescript', 'groq')).toContain("baseURL: 'https://api.groq.com/openai/v1'");
  });
});
