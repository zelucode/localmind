import React, { useState, useMemo } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  Terminal,
  FileCode,
  Laptop,
  Layers,
  KeyRound,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  FolderGit2,
  Play
} from 'lucide-react';
import { StoredApiKey } from '../types';

interface IDEConfigExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedKeys: StoredApiKey[];
  onSaveKey?: (key: StoredApiKey) => void;
  initialProvider?: string;
}

type TargetToolId =
  | 'continue'
  | 'cline'
  | 'cursor'
  | 'aider'
  | 'windsurf'
  | 'python'
  | 'typescript'
  | 'curl';

interface TargetTool {
  id: TargetToolId;
  name: string;
  category: 'IDE Extension' | 'CLI Agent' | 'AI Editor' | 'Developer SDK';
  configFileName: string;
  description: string;
}

const TARGET_TOOLS: TargetTool[] = [
  {
    id: 'continue',
    name: 'Continue.dev',
    category: 'IDE Extension',
    configFileName: '~/.continue/config.json',
    description: 'Leading open-source AI code assistant for VS Code & JetBrains.',
  },
  {
    id: 'cline',
    name: 'Cline (Autonomous Agent)',
    category: 'IDE Extension',
    configFileName: 'VS Code Extension Settings',
    description: 'Autonomous coding agent for VS Code that executes terminal commands and edits.',
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    category: 'AI Editor',
    configFileName: 'Settings → Models & .cursorrules',
    description: 'AI-first code editor with custom OpenAI-compatible endpoint support.',
  },
  {
    id: 'aider',
    name: 'Aider CLI',
    category: 'CLI Agent',
    configFileName: '.aider.conf.yml / Terminal',
    description: 'Terminal AI pair programmer that writes Git commits directly.',
  },
  {
    id: 'windsurf',
    name: 'Windsurf / Codeium',
    category: 'AI Editor',
    configFileName: 'Cascade Custom Models',
    description: 'Custom OpenAI-compatible provider setup for Cascade agent.',
  },
  {
    id: 'python',
    name: 'Python SDK',
    category: 'Developer SDK',
    configFileName: 'agent.py & .env',
    description: 'Ready-to-run Python script using official client libraries.',
  },
  {
    id: 'typescript',
    name: 'TypeScript / Node.js',
    category: 'Developer SDK',
    configFileName: 'agent.ts & .env',
    description: 'Modern Node/TypeScript script ready for your backend or CLI tool.',
  },
  {
    id: 'curl',
    name: 'Terminal cURL',
    category: 'Developer SDK',
    configFileName: 'Terminal Shell',
    description: 'Instant 1-line bash command to test inference in terminal.',
  },
];

interface ProviderPreset {
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

const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (AI Studio)',
    defaultModel: 'gemini-2.5-flash',
    availableModels: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', notes: 'Fast, 1M context, 15 RPM, 1,500 RPD' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', notes: 'Elite reasoning, 1M context, 2 RPM' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', notes: 'High throughput, zero latency' },
    ],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    envVarName: 'GEMINI_API_KEY',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    freeTierTag: '1,500 RPD • 1M Context • No CC',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', notes: 'Fastest 70B, 30 RPM, 14,400 RPD' },
      { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', notes: 'Specialized for programming' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', notes: '750+ tokens/sec autocomplete' },
    ],
    baseUrl: 'https://api.groq.com/openai/v1',
    envVarName: 'GROQ_API_KEY',
    docsUrl: 'https://console.groq.com/docs/models',
    getKeyUrl: 'https://console.groq.com/keys',
    freeTierTag: '30 RPM • 14,400 RPD • No CC',
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

export const IDEConfigExporterModal: React.FC<IDEConfigExporterModalProps> = ({
  isOpen,
  onClose,
  savedKeys,
  onSaveKey,
  initialProvider,
}) => {
  const [selectedToolId, setSelectedToolId] = useState<TargetToolId>('continue');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => {
    return initialProvider || 'gemini';
  });
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [useRealKey, setUseRealKey] = useState<boolean>(true);
  const [manualKeyInput, setManualKeyInput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Sync provider change
  const currentProvider = useMemo(() => {
    return PROVIDER_PRESETS.find((p) => p.id === selectedProviderId) || PROVIDER_PRESETS[0];
  }, [selectedProviderId]);

  // Sync default model when provider changes
  const handleSelectProvider = (provId: string) => {
    setSelectedProviderId(provId);
    const prov = PROVIDER_PRESETS.find((p) => p.id === provId);
    if (prov) {
      setSelectedModel(prov.defaultModel);
    }
  };

  // Find saved key in vault for this provider if any
  const matchedVaultKey = useMemo(() => {
    return savedKeys.find((k) => k.provider === selectedProviderId);
  }, [savedKeys, selectedProviderId]);

  const activeKeyString = useMemo(() => {
    if (!useRealKey) {
      return `YOUR_${currentProvider.envVarName}`;
    }
    if (manualKeyInput.trim()) {
      return manualKeyInput.trim();
    }
    if (matchedVaultKey?.key) {
      return matchedVaultKey.key;
    }
    if (selectedProviderId === 'omniroute' || selectedProviderId === 'ollama') {
      return 'dummy-key';
    }
    return `YOUR_${currentProvider.envVarName}`;
  }, [useRealKey, manualKeyInput, matchedVaultKey, currentProvider, selectedProviderId]);

  const activeTool = useMemo(() => {
    return TARGET_TOOLS.find((t) => t.id === selectedToolId) || TARGET_TOOLS[0];
  }, [selectedToolId]);

  // Generate configuration snippet based on tool + provider + key
  const generatedSnippet = useMemo(() => {
    const key = activeKeyString;
    const model = selectedModel;
    const baseUrl = currentProvider.baseUrl;

    switch (selectedToolId) {
      case 'continue':
        return `// Add this entry to your ~/.continue/config.json in the "models" array:
{
  "models": [
    {
      "title": "${currentProvider.name} (${model})",
      "provider": "${selectedProviderId === 'gemini' ? 'gemini' : selectedProviderId === 'ollama' ? 'ollama' : 'openai'}",
      "model": "${model}",
      "apiKey": "${key}",
      ${selectedProviderId !== 'gemini' && selectedProviderId !== 'ollama' ? `"apiBase": "${baseUrl}",\n      ` : ''}"contextLength": 128000
    }
  ],
  "tabAutocompleteModel": {
    "title": "Groq Fast Autocomplete",
    "provider": "openai",
    "model": "llama-3.1-8b-instant",
    "apiBase": "https://api.groq.com/openai/v1",
    "apiKey": "${savedKeys.find(k => k.provider === 'groq')?.key || 'YOUR_GROQ_API_KEY'}"
  }
}`;

      case 'cline':
        if (selectedProviderId === 'gemini') {
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

      case 'aider':
        return `# Option A: Run Aider directly in your terminal
export ${currentProvider.envVarName}="${key}"
${
  selectedProviderId === 'gemini'
    ? `aider --model gemini/${model}`
    : selectedProviderId === 'groq'
    ? `aider --openai-api-base ${baseUrl} --openai-api-key ${key} --model groq/${model}`
    : selectedProviderId === 'openrouter'
    ? `aider --model openrouter/${model} --api-key openrouter=${key}`
    : `aider --openai-api-base ${baseUrl} --openai-api-key ${key} --model openai/${model}`
}

# Option B: Or save into your repo's .aider.conf.yml file:
model: ${selectedProviderId === 'gemini' ? `gemini/${model}` : `openai/${model}`}
${selectedProviderId !== 'gemini' ? `openai-api-base: ${baseUrl}\n` : ''}openai-api-key: ${key}
auto-commits: true
stream: true`;

      case 'windsurf':
        return `// Windsurf (Codeium Cascade) Custom Model Setup:
// 1. Click Settings → AI Providers → Add Custom OpenAI Endpoint
// 2. Configure:
Provider Name: ${currentProvider.name}
Endpoint URL:  ${baseUrl}
API Key:       ${key}
Model Name:    ${model}
Supports Tools / Function Calling: Yes`;

      case 'python':
        if (selectedProviderId === 'gemini') {
          return `# Install: pip install google-genai
import os
from google import genai

# Load key from environment or direct string
client = genai.Client(api_key="${key}")

response = client.models.generate_content(
    model="${model}",
    contents="Explain rate-limit rotation strategies for coding agents in 3 bullet points.",
)

print(response.text)`;
        }
        return `# Install: pip install openai
import os
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
        if (selectedProviderId === 'gemini') {
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
curl ${baseUrl}chat/completions \\
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
  }, [selectedToolId, selectedProviderId, selectedModel, currentProvider, activeKeyString, savedKeys]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveManualKeyToVault = () => {
    if (!manualKeyInput.trim() || !onSaveKey) return;
    const newKey: StoredApiKey = {
      id: `key_${Date.now()}`,
      provider: selectedProviderId as any,
      providerName: currentProvider.name,
      key: manualKeyInput.trim(),
      label: `${currentProvider.name} (Exported)`,
      createdAt: new Date().toLocaleDateString(),
      freeTierNotes: currentProvider.freeTierTag,
      getKeyUrl: currentProvider.getKeyUrl,
    };
    onSaveKey(newKey);
    setManualKeyInput('');
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-ide-exporter-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-sm transition-opacity animate-in fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        id="modal-ide-exporter-content"
        className="w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="p-2 rounded-xl"
              style={{
                backgroundColor: 'var(--theme-raised)',
                color: 'var(--theme-primary)',
              }}
            >
              <Code2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                IDE & Coding Agent Config Exporter
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                Zero-to-code setup: Generate 1-click configs for Cline, Continue, Cursor, Aider & SDKs
              </p>
            </div>
          </div>

          <button
            id="btn-close-ide-exporter"
            onClick={onClose}
            className="p-2 rounded-xl border transition-colors cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-muted)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Step 1: Select Target IDE / Agent */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--theme-text-secondary)' }}>
              1. Select Your Target Tool / Environment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TARGET_TOOLS.map((tool) => {
                const isSelected = selectedToolId === tool.id;
                return (
                  <button
                    key={tool.id}
                    id={`btn-target-tool-${tool.id}`}
                    onClick={() => setSelectedToolId(tool.id)}
                    className="p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between"
                    style={{
                      backgroundColor: isSelected ? 'var(--theme-raised)' : 'transparent',
                      borderColor: isSelected ? 'var(--theme-primary)' : 'var(--theme-border)',
                      boxShadow: isSelected ? 'inset 0 0 0 1px var(--theme-primary)' : 'none',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--theme-text)' }}>
                          {tool.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />}
                      </div>
                      <span className="text-[10px] block opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
                        {tool.configFileName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Provider & Free Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--theme-text-secondary)' }}>
                2. Select Free AI Provider
              </label>
              <div className="space-y-1.5">
                {PROVIDER_PRESETS.map((prov) => {
                  const isSelected = selectedProviderId === prov.id;
                  const hasVaultKey = savedKeys.some((k) => k.provider === prov.id);
                  return (
                    <button
                      key={prov.id}
                      onClick={() => handleSelectProvider(prov.id)}
                      className="w-full px-3 py-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? 'var(--theme-raised)' : 'transparent',
                        borderColor: isSelected ? 'var(--theme-primary)' : 'var(--theme-border)',
                        color: 'var(--theme-text)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{prov.name}</span>
                        {hasVaultKey && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-medium"
                            style={{
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                            }}
                          >
                            Key Saved
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] opacity-70 font-mono">
                        {prov.freeTierTag.split('•')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--theme-text-secondary)' }}>
                3. Select Free Model
              </label>
              <div className="space-y-2">
                {currentProvider.availableModels.map((m) => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className="w-full p-3 rounded-xl border text-left transition-all cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? 'var(--theme-raised)' : 'transparent',
                        borderColor: isSelected ? 'var(--theme-primary)' : 'var(--theme-border)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold" style={{ color: isSelected ? 'var(--theme-primary)' : 'var(--theme-text)' }}>
                          {m.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />}
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                        {m.notes}
                      </p>
                    </button>
                  );
                })}

                <div className="p-3 rounded-xl border mt-2 flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}>
                  <div>
                    <span className="font-semibold block">Need a free API key?</span>
                    <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
                      {currentProvider.freeTierTag}
                    </span>
                  </div>
                  <a
                    href={currentProvider.getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 hover:opacity-85"
                    style={{
                      backgroundColor: 'var(--theme-card)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-primary)',
                    }}
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Key Injection Option */}
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  API Key Injection
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseRealKey(!useRealKey)}
                  className="text-xs px-2.5 py-1 rounded-lg border cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  {useRealKey ? 'Using Actual Key' : 'Using Placeholder (YOUR_API_KEY)'}
                </button>
              </div>
            </div>

            {useRealKey && (
              <div className="space-y-2 mt-2">
                {matchedVaultKey ? (
                  <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Automatically using your saved <strong>{matchedVaultKey.label}</strong> from Vault!
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={manualKeyInput}
                      onChange={(e) => setManualKeyInput(e.target.value)}
                      placeholder={`Paste your ${currentProvider.name} key here to inject...`}
                      className="w-full px-3 py-2 text-xs rounded-lg border font-mono focus:outline-none"
                      style={{
                        backgroundColor: 'var(--theme-card)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text)',
                      }}
                    />
                    {manualKeyInput.trim() && onSaveKey && (
                      <button
                        type="button"
                        onClick={handleSaveManualKeyToVault}
                        className="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer shadow-sm active:scale-95"
                        style={{
                          backgroundColor: 'var(--theme-primary)',
                          color: 'var(--theme-primary-foreground, #000000)',
                        }}
                      >
                        Save to Vault
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 4: Generated Code Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Ready-to-Paste Config ({activeTool.configFileName})
                </span>
              </div>
              <button
                id="btn-copy-generated-config"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                style={{
                  backgroundColor: copied ? '#10b981' : 'var(--theme-primary)',
                  color: copied ? '#ffffff' : 'var(--theme-primary-foreground, #000000)',
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Config'}</span>
              </button>
            </div>

            <div
              className="rounded-xl border p-4 font-mono text-xs overflow-x-auto relative"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderColor: 'var(--theme-border)',
                color: '#e2e8f0',
                lineHeight: 1.6,
              }}
            >
              <pre className="whitespace-pre-wrap">{generatedSnippet}</pre>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div
          className="px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between text-xs shrink-0 gap-2"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-muted)',
          }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              Configuring <strong>{activeTool.name}</strong> with <strong>{currentProvider.name}</strong> ({selectedModel}).
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border text-xs font-medium cursor-pointer hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
