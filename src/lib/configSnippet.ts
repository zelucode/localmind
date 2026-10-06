export type TargetToolId =
  | 'continue'
  | 'cline'
  | 'cursor'
  | 'aider'
  | 'windsurf'
  | 'python'
  | 'typescript'
  | 'curl';

export interface ProviderPreset {
  id: string;
  name: string;
  defaultModel: string;
  availableModels: { id: string; name: string; notes: string }[];
  baseUrl: string;
  envVarName: string;
  docsUrl: string;
  getKeyUrl: string;
  freeTierTag: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (AI Studio)',
    defaultModel: 'gemini-2.5-flash',
    availableModels: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', notes: 'Fast, 1M context, free quota varies by account' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', notes: 'Elite reasoning, 1M context, 2 RPM' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', notes: 'High throughput, zero latency' },
    ],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    envVarName: 'GEMINI_API_KEY',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    freeTierTag: 'Free quota varies • 1M Context • No CC',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', notes: 'Fastest 70B, 30 RPM, ~1,000 RPD' },
      { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', notes: 'Specialized for programming' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', notes: '750+ tokens/sec autocomplete' },
    ],
    baseUrl: 'https://api.groq.com/openai/v1',
    envVarName: 'GROQ_API_KEY',
    docsUrl: 'https://console.groq.com/docs/models',
    getKeyUrl: 'https://console.groq.com/keys',
    freeTierTag: '30 RPM • ~1,000 RPD (70B) • No CC',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter Free Tier',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    availableModels: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', notes: '20 RPM, No cost' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', notes: 'High reasoning chain-of-thought' },
      { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B (Free)', notes: 'Google lightweight open model' },
      { id: 'stepfun/step-3.5-flash:free', name: 'StepFun 3.5 Flash (Free)', notes: 'Free model router' },
    ],
    baseUrl: 'https://openrouter.ai/api/v1',
    envVarName: 'OPENROUTER_API_KEY',
    docsUrl: 'https://openrouter.ai/docs',
    getKeyUrl: 'https://openrouter.ai/keys',
    freeTierTag: '20 RPM • 25+ Free Models • No CC',
  },
  {
    id: 'mistral',
    name: 'Mistral AI (Codestral)',
    defaultModel: 'codestral-latest',
    availableModels: [
      { id: 'codestral-latest', name: 'Codestral Latest', notes: 'State of the art code gen & FIM' },
      { id: 'mistral-small-latest', name: 'Mistral Small', notes: 'General reasoning & speed' },
    ],
    baseUrl: 'https://api.mistral.ai/v1',
    envVarName: 'MISTRAL_API_KEY',
    docsUrl: 'https://docs.mistral.ai/api/',
    getKeyUrl: 'https://console.mistral.ai/api-keys/',
    freeTierTag: '1 RPS • Free Dev Access • No CC',
  },
  {
    id: 'github',
    name: 'GitHub Models',
    defaultModel: 'gpt-4o-mini',
    availableModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', notes: 'Free via personal access token, 15 RPM' },
      { id: 'Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', notes: '150 requests/day free' },
    ],
    baseUrl: 'https://models.inference.ai.azure.com',
    envVarName: 'GITHUB_TOKEN',
    docsUrl: 'https://github.com/marketplace/models',
    getKeyUrl: 'https://github.com/settings/tokens',
    freeTierTag: '150 RPD • Free with GitHub Account',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek API',
    defaultModel: 'deepseek-chat',
    availableModels: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', notes: 'General and coding, very low price' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', notes: 'Step-by-step reasoning' },
    ],
    baseUrl: 'https://api.deepseek.com/v1',
    envVarName: 'DEEPSEEK_API_KEY',
    docsUrl: 'https://api-docs.deepseek.com',
    getKeyUrl: 'https://platform.deepseek.com/api_keys',
    freeTierTag: 'Pay-as-you-go • Very low cost',
  },
  {
    id: 'omniroute',
    name: 'OmniRoute Daemon (Local Router)',
    defaultModel: 'gemini-2.5-flash',
    availableModels: [
      { id: 'gemini-2.5-flash', name: 'OmniRoute -> Gemini 2.5 Flash', notes: 'Routed through local proxy' },
      { id: 'groq-llama-70b', name: 'OmniRoute -> Groq 70B', notes: 'Fast fallback' },
      { id: 'auto-free-coder', name: 'OmniRoute -> Auto-Coder Rotation', notes: 'Rotates when rate limited' },
    ],
    baseUrl: 'http://localhost:8000/v1',
    envVarName: 'OPENAI_API_KEY',
    docsUrl: 'http://localhost:8000/docs',
    getKeyUrl: 'http://localhost:8000',
    freeTierTag: 'Local Daemon • Auto Rate-Limit Retry',
  },
  {
    id: 'ollama',
    name: 'Local Ollama (Offline)',
    defaultModel: 'qwen2.5-coder:7b',
    availableModels: [
      { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B', notes: 'Best local coding model for 8GB VRAM' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B Distill', notes: 'Local reasoning on CPU/GPU' },
      { id: 'llama3.2:3b', name: 'Llama 3.2 3B', notes: 'Super lightweight for laptops' },
    ],
    baseUrl: 'http://localhost:11434/v1',
    envVarName: 'OPENAI_API_KEY',
    docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/openai.md',
    getKeyUrl: 'https://ollama.com',
    freeTierTag: '100% Free • Unlimited • 100% Offline',
  },
];

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
