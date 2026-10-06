/**
 * Single source of truth for API provider facts. The Rate-Limit Matrix, the Config Exporter presets
 * and the Key Vault provider list are all derived from `PROVIDERS` below, so a quota, endpoint or key
 * URL is edited in one place.
 *
 * `reviewed` is the month someone last checked the row against the provider's own pages. Rows without
 * it are shown as not re-checked; never fill it in without actually checking.
 */

export interface ProviderModel {
  id: string;
  name: string;
  notes: string;
}

/** Quota facts shown in the Rate-Limit Matrix. */
export interface ProviderLimits {
  bestModel: string;
  rpm: number | string;
  rpd: number | string;
  tpm: string;
  contextWindow: string;
  creditCardRequired: boolean;
  renewalCycle: string;
  role: string;
  speed: 'Ultra Fast (<200ms)' | 'Fast (1-2s)' | 'Standard (2-4s)' | 'Local Hardware';
  category: 'cloud-api' | 'router' | 'local';
}

/** What the Config Exporter needs to write a working config. */
export interface ProviderApi {
  defaultModel: string;
  availableModels: ProviderModel[];
  baseUrl: string;
  envVarName: string;
  freeTierTag: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  getKeyUrl: string;
  docsUrl: string;
  /** 'YYYY-MM' of the last real check against the provider's pages. */
  reviewed?: string;
  isFree: boolean;
  /** One line for the Key Vault. */
  freeQuota: string;
  setupGuide: string;
  /** Selectable in the Key Vault (its id is a `StoredApiKey['provider']`). */
  inVault: boolean;
  limits?: ProviderLimits;
  api?: ProviderApi;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    reviewed: '2026-10',
    isFree: true,
    freeQuota: 'Free tier on Gemini 2.5 Flash. The daily cap varies by account (reports range from about 20 to 250 requests/day), so check AI Studio.',
    setupGuide: 'Open Google AI Studio -> Click "Get API key" -> Create key in 1 click without entering a credit card.',
    inVault: true,
    limits: {
      bestModel: 'Gemini 2.5 Flash',
      rpm: '10-15',
      rpd: 'Varies (often 250 or less)',
      tpm: '250,000 TPM',
      contextWindow: '1,048,576 tokens',
      creditCardRequired: false,
      renewalCycle: 'Daily (Resets midnight UTC)',
      role: 'Primary Reasoning & Whole-Codebase Context',
      speed: 'Fast (1-2s)',
      category: 'cloud-api',
    },
    api: {
      defaultModel: 'gemini-2.5-flash',
      availableModels: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', notes: 'Fast, 1M context, free quota varies by account' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', notes: 'Elite reasoning, 1M context, 2 RPM' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', notes: 'High throughput, zero latency' },
      ],
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      envVarName: 'GEMINI_API_KEY',
      freeTierTag: 'Free quota varies • 1M Context • No CC',
    },
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    getKeyUrl: 'https://console.groq.com/keys',
    docsUrl: 'https://console.groq.com/docs/models',
    reviewed: '2026-10',
    isFree: true,
    freeQuota: 'Free plan, limits per model. Llama 3.3 70B: 30 RPM, about 1,000 requests/day, 12,000 TPM.',
    setupGuide: 'Sign up at console.groq.com with GitHub/Google -> Generate instant free API key.',
    inVault: true,
    limits: {
      bestModel: 'Llama 3.3 70B Versatile',
      rpm: 30,
      rpd: 1000,
      tpm: '12,000 TPM',
      contextWindow: '128,000 tokens',
      creditCardRequired: false,
      renewalCycle: 'Daily (limits are per model)',
      role: 'Fast In-line Diffs & Code Autocomplete',
      speed: 'Ultra Fast (<200ms)',
      category: 'cloud-api',
    },
    api: {
      defaultModel: 'llama-3.3-70b-versatile',
      availableModels: [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', notes: 'Fastest 70B, 30 RPM, ~1,000 RPD' },
        { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', notes: 'Specialized for programming' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', notes: '750+ tokens/sec autocomplete' },
      ],
      baseUrl: 'https://api.groq.com/openai/v1',
      envVarName: 'GROQ_API_KEY',
      freeTierTag: '30 RPM • ~1,000 RPD (70B) • No CC',
    },
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    getKeyUrl: 'https://openrouter.ai/keys',
    docsUrl: 'https://openrouter.ai/docs',
    isFree: true,
    freeQuota: 'Free tier models (models ending in :free) can be queried at no charge',
    setupGuide: 'Visit openrouter.ai/keys -> Sign in -> Create key. Use models like deepseek/deepseek-r1:free.',
    inVault: true,
    limits: {
      bestModel: 'DeepSeek R1 / Llama 3.3 (:free)',
      rpm: 20,
      rpd: '50-1,000',
      tpm: 'Provider limits',
      contextWindow: '32,000 - 128,000 tokens',
      creditCardRequired: false,
      renewalCycle: 'Rolling 24-hour window',
      role: 'Fallback Failover & Novel Model Trials',
      speed: 'Standard (2-4s)',
      category: 'router',
    },
    api: {
      defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
      availableModels: [
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', notes: '20 RPM, No cost' },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', notes: 'High reasoning chain-of-thought' },
        { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B (Free)', notes: 'Google lightweight open model' },
        { id: 'stepfun/step-3.5-flash:free', name: 'StepFun 3.5 Flash (Free)', notes: 'Free model router' },
      ],
      baseUrl: 'https://openrouter.ai/api/v1',
      envVarName: 'OPENROUTER_API_KEY',
      freeTierTag: '20 RPM • 25+ Free Models • No CC',
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek API',
    getKeyUrl: 'https://platform.deepseek.com/api_keys',
    docsUrl: 'https://api-docs.deepseek.com',
    reviewed: '2026-10',
    isFree: false,
    freeQuota: 'No free tier: pay-as-you-go at a very low per-token price.',
    setupGuide: 'Register at platform.deepseek.com -> Top up a small balance -> Create API key.',
    inVault: true,
    limits: {
      bestModel: 'DeepSeek R1 / V3',
      rpm: 'No fixed limit',
      rpd: 'Pay-as-you-go',
      tpm: 'Variable',
      contextWindow: '64,000 tokens',
      creditCardRequired: true,
      renewalCycle: 'No free tier: very low per-token price',
      role: 'Elite Mathematical & Algorithmic Debugging',
      speed: 'Standard (2-4s)',
      category: 'cloud-api',
    },
    api: {
      defaultModel: 'deepseek-chat',
      availableModels: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', notes: 'General and coding, very low price' },
        { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', notes: 'Step-by-step reasoning' },
      ],
      baseUrl: 'https://api.deepseek.com/v1',
      envVarName: 'DEEPSEEK_API_KEY',
      freeTierTag: 'Pay-as-you-go • Very low cost',
    },
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    getKeyUrl: 'https://console.mistral.ai/api-keys/',
    docsUrl: 'https://docs.mistral.ai/api/',
    isFree: true,
    freeQuota: 'Experimentation tier with free trial credits for Mistral Small, Large, and Codestral',
    setupGuide: 'Sign in to console.mistral.ai -> Go to API keys -> Generate key for development.',
    inVault: true,
    limits: {
      bestModel: 'Codestral Latest',
      rpm: '60 (1 RPS)',
      rpd: 'Generous Dev Cap',
      tpm: '500,000 TPM',
      contextWindow: '32,000 - 256,000 tokens',
      creditCardRequired: false,
      renewalCycle: 'Perpetual free development access',
      role: 'Dedicated Coding Agent & FIM (Fill-in-Middle)',
      speed: 'Fast (1-2s)',
      category: 'cloud-api',
    },
    api: {
      defaultModel: 'codestral-latest',
      availableModels: [
        { id: 'codestral-latest', name: 'Codestral Latest', notes: 'State of the art code gen & FIM' },
        { id: 'mistral-small-latest', name: 'Mistral Small', notes: 'General reasoning & speed' },
      ],
      baseUrl: 'https://api.mistral.ai/v1',
      envVarName: 'MISTRAL_API_KEY',
      freeTierTag: '1 RPS • Free Dev Access • No CC',
    },
  },
  {
    id: 'omniroute',
    name: 'OmniRoute (Local Router)',
    getKeyUrl: 'http://localhost:8000',
    docsUrl: 'http://localhost:8000/docs',
    isFree: true,
    freeQuota: 'Runs on your machine; uses the keys you give it',
    setupGuide: 'Start OmniRoute locally (see Runtimes) and point tools at http://localhost:8000/v1.',
    inVault: false,
    api: {
      defaultModel: 'gemini-2.5-flash',
      availableModels: [
        { id: 'gemini-2.5-flash', name: 'OmniRoute -> Gemini 2.5 Flash', notes: 'Routed through local proxy' },
        { id: 'groq-llama-70b', name: 'OmniRoute -> Groq 70B', notes: 'Fast fallback' },
        { id: 'auto-free-coder', name: 'OmniRoute -> Auto-Coder Rotation', notes: 'Rotates when rate limited' },
      ],
      baseUrl: 'http://localhost:8000/v1',
      envVarName: 'OPENAI_API_KEY',
      freeTierTag: 'Local Daemon • Auto Rate-Limit Retry',
    },
  },
  {
    id: 'ollama',
    name: 'Local Ollama',
    getKeyUrl: 'https://ollama.com',
    docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/openai.md',
    isFree: true,
    freeQuota: 'Free and offline; limited only by your hardware',
    setupGuide: 'Install Ollama, then `ollama pull qwen2.5-coder:7b`.',
    inVault: false,
    limits: {
      bestModel: 'Qwen 2.5 Coder 7B / DeepSeek 8B',
      rpm: 'Unlimited',
      rpd: 'Unlimited',
      tpm: 'Hardware Bound',
      contextWindow: '4,096 - 32,768 tokens',
      creditCardRequired: false,
      renewalCycle: 'Perpetual (100% Offline & Private)',
      role: 'Air-Gapped Privacy & Offline Failover',
      speed: 'Local Hardware',
      category: 'local',
    },
    api: {
      defaultModel: 'qwen2.5-coder:7b',
      availableModels: [
        { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B', notes: 'Best local coding model for 8GB VRAM' },
        { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B Distill', notes: 'Local reasoning on CPU/GPU' },
        { id: 'llama3.2:3b', name: 'Llama 3.2 3B', notes: 'Super lightweight for laptops' },
      ],
      baseUrl: 'http://localhost:11434/v1',
      envVarName: 'OPENAI_API_KEY',
      freeTierTag: '100% Free • Unlimited • 100% Offline',
    },
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs',
    isFree: false,
    freeQuota: 'Pay-as-you-go; some new student or promotion accounts receive initial trial credits',
    setupGuide: 'Sign in to platform.openai.com -> API keys -> Requires payment method for ongoing usage.',
    inVault: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude API',
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://docs.anthropic.com',
    isFree: false,
    freeQuota: 'Pay-as-you-go; check the console for any trial credit on new accounts',
    setupGuide: 'Console.anthropic.com -> Create an account -> Generate key (billing required for ongoing use).',
    inVault: true,
  },
];

// ---- Derived views (what the three features consume) ----

/** Key Vault provider list. */
export const POPULAR_API_PROVIDERS = PROVIDERS.filter((p) => p.inVault).map((p) => ({
  provider: p.id as 'gemini' | 'openrouter' | 'groq' | 'deepseek' | 'openai' | 'anthropic' | 'mistral',
  name: p.name,
  getKeyUrl: p.getKeyUrl,
  freeQuota: p.freeQuota,
  isFree: p.isFree,
  setupGuide: p.setupGuide,
}));

export interface RateLimitItem extends ProviderLimits {
  id: string;
  provider: string;
  getKeyUrl: string;
  reviewed?: string;
}

/** Rate-Limit Matrix rows. */
export const RATE_LIMIT_DATA: RateLimitItem[] = PROVIDERS.filter((p) => p.limits).map((p) => ({
  id: p.id,
  provider: p.name,
  getKeyUrl: p.getKeyUrl,
  reviewed: p.reviewed,
  ...p.limits!,
}));

export interface ProviderPreset extends ProviderApi {
  id: string;
  name: string;
  docsUrl: string;
  getKeyUrl: string;
}

/** Config Exporter presets. */
export const PROVIDER_PRESETS: ProviderPreset[] = PROVIDERS.filter((p) => p.api).map((p) => ({
  id: p.id,
  name: p.name,
  docsUrl: p.docsUrl,
  getKeyUrl: p.getKeyUrl,
  ...p.api!,
}));
