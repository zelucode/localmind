import type { ProviderPreset } from '../data/providers';

export type TargetToolId =
  | 'continue'
  | 'cline'
  | 'cursor'
  | 'aider'
  | 'windsurf'
  | 'python'
  | 'typescript'
  | 'curl';

/** `base` + `path` with exactly one slash between them (preset base URLs are inconsistent about a trailing slash). */
export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** Providers Aider (via LiteLLM) knows natively: `<prefix>/<model>` plus the provider's own env var. */
const AIDER_NATIVE_PREFIX: Record<string, string> = {
  gemini: 'gemini',
  groq: 'groq',
  openrouter: 'openrouter',
  mistral: 'mistral',
  deepseek: 'deepseek',
};

export interface SnippetInput {
  toolId: TargetToolId;
  provider: ProviderPreset;
  model: string;
  /** The key (or placeholder) to embed. */
  key: string;
}

export function buildConfigSnippet({ toolId, provider, model, key }: SnippetInput): string {
  const baseUrl = provider.baseUrl;
  const providerId = provider.id;

  switch (toolId) {
    case 'continue': {
      const isGemini = providerId === 'gemini';
      const isOllama = providerId === 'ollama';
      const entry: Record<string, unknown> = {
        title: `${provider.name} (${model})`,
        provider: isGemini ? 'gemini' : isOllama ? 'ollama' : 'openai',
        model,
        // A local Ollama server needs no key.
        ...(isOllama ? {} : { apiKey: key }),
        ...(isGemini || isOllama ? {} : { apiBase: baseUrl }),
        contextLength: 128000,
      };
      const config: Record<string, unknown> = { models: [entry] };
      // Cheap autocomplete model, only when it can reuse the Groq key that is already selected.
      if (providerId === 'groq') {
        config.tabAutocompleteModel = {
          title: 'Groq Fast Autocomplete',
          provider: 'openai',
          model: 'llama-3.1-8b-instant',
          apiBase: baseUrl,
          apiKey: key,
        };
      }
      return `// Merge this into your ~/.continue/config.json (add the entry to "models"):\n${JSON.stringify(config, null, 2)}`;
    }

    case 'cline':
      if (providerId === 'gemini') {
        return `// In VS Code Cline Extension Settings:
1. Open Cline side-panel in VS Code
2. Click the ⚙️ Settings gear icon
3. Set API Provider: "Google Gemini"
4. Enter Gemini API Key:
   ${key}
5. Model ID: "${model}"
6. Context Window: 1,000,000 tokens (Supports whole codebase indexing!)`;
      }
      return `// In VS Code Cline Extension Settings:
1. Open Cline side-panel in VS Code
2. Click the ⚙️ Settings gear icon
3. Set API Provider: "OpenAI Compatible"
4. Base URL:
   ${baseUrl}
5. API Key:
   ${key}
6. Model ID:
   ${model}
7. Max Tokens: 8192`;

    case 'cursor':
      return `// Cursor IDE Configuration:
// Step 1: Open Cursor Settings (Cmd+, or Ctrl+,) → "Models"
// Step 2: Under "OpenAI API Key", toggle "Override OpenAI Base URL"
// Set Base URL:
${baseUrl}

// API Key:
${key}

// Step 3: Add Model name in the model list:
${model}

// Step 4 (Optional): Put this in your project's .cursorrules file:
You are an expert full-stack developer running with free-tier model ${model}.
Prioritize modular, concise, type-safe solutions with high signal-to-noise ratio.`;

    case 'aider': {
      const prefix = AIDER_NATIVE_PREFIX[providerId];
      if (prefix) {
        return `# Option A: Run Aider directly in your terminal
export ${provider.envVarName}="${key}"
aider --model ${prefix}/${model}

# Option B: Or save into your repo's .aider.conf.yml file:
model: ${prefix}/${model}
api-key:
  - ${prefix}=${key}
auto-commits: true
stream: true`;
      }
      return `# Option A: Run Aider directly in your terminal
aider --openai-api-base ${baseUrl} --openai-api-key ${key} --model openai/${model}

# Option B: Or save into your repo's .aider.conf.yml file:
model: openai/${model}
openai-api-base: ${baseUrl}
openai-api-key: ${key}
auto-commits: true
stream: true`;
    }

    case 'windsurf':
      return `// Windsurf (Codeium Cascade) Custom Model Setup:
// 1. Click Settings → AI Providers → Add Custom OpenAI Endpoint
// 2. Configure:
Provider Name: ${provider.name}
Endpoint URL:  ${baseUrl}
API Key:       ${key}
Model Name:    ${model}
Supports Tools / Function Calling: Yes`;

    case 'python':
      if (providerId === 'gemini') {
        return `# Install: pip install google-genai
from google import genai

client = genai.Client(api_key="${key}")

response = client.models.generate_content(
    model="${model}",
    contents="Explain rate-limit rotation strategies for coding agents in 3 bullet points.",
)

print(response.text)`;
      }
      return `# Install: pip install openai
from openai import OpenAI

client = OpenAI(
    base_url="${baseUrl}",
    api_key="${key}",
)

completion = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "system", "content": "You are a professional software architect."},
        {"role": "user", "content": "Write a clean TypeScript debounce utility function."}
    ],
)

print(completion.choices[0].message.content)`;

    case 'typescript':
      if (providerId === 'gemini') {
        return `// Install: npm install @google/genai
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: '${key}' });

async function main() {
  const response = await ai.models.generateContent({
    model: '${model}',
    contents: 'Explain rate-limit rotation strategies for coding agents in 3 bullet points.',
  });

  console.log(response.text);
}

main().catch(console.error);`;
      }
      return `// Install: npm install openai
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${baseUrl}',
  apiKey: '${key}',
});

async function run() {
  const completion = await client.chat.completions.create({
    model: '${model}',
    messages: [
      { role: 'system', content: 'You are a professional software architect.' },
      { role: 'user', content: 'Write a clean TypeScript debounce utility function.' },
    ],
  });

  console.log(completion.choices[0].message.content);
}

run().catch(console.error);`;

    case 'curl':
      return `# Instant Terminal Test:
curl ${joinUrl(baseUrl, 'chat/completions')} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${key}" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "Hello world from terminal! Respond in 1 line."}
    ],
    "max_tokens": 100
  }'`;

    default:
      return '';
  }
}
