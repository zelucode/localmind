export type ActiveView = 'home' | 'tools' | 'bookmarks' | 'runtimes' | 'configs' | 'vault' | 'settings';

export type ToolCategory =
  | 'all'
  | 'web-llm'
  | 'coding-agent'
  | 'design-media'
  | 'uniform-proxy'
  | 'custom';

export type BookmarkCategory =
  | 'all'
  | 'developer'
  | 'design'
  | 'converters'
  | 'ai-utilities'
  | 'productivity'
  | 'utilities'
  | 'security'
  | 'education'
  | 'media'
  | 'custom';

export interface ToolBookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  category: BookmarkCategory;
  isAi: boolean; // false for non-AI online utilities, true for AI utilities
  freeTierBadge: string; // e.g. '100% Free - No Sign Up', 'Free Web Tool'
  tags: string[];
  isFavorite?: boolean;
  clickCount?: number;
  createdAt: string;
  notes?: string;
  isCustom?: boolean;
  githubUrl?: string;
  stars?: number;
  license?: string;
}

export type CapabilityScope =
  | 'web-only'       // Runs in cloud/browser, CANNOT modify local files
  | 'local-agent'     // Desktop or CLI agent, CAN read/modify local files
  | 'ide-plugin'      // VSCode/IDE extension, works directly in editor
  | 'local-runner'    // Self-hosted offline model runner (Ollama, LM Studio, etc.)
  | 'uniform-proxy'   // Multi-provider router or API gateway (OmniRoute, OpenRouter)
  | 'cloud-builder';  // Cloud app workspace (Google AI Studio, Bolt.new, etc.)

export interface FreeTierDetails {
  summary: string;
  hasWebSearch: boolean;
  creditCardRequired: boolean;
  allowCustomApiKey: boolean;
  limits: string;
  freeCreditValue?: string;
  resetCycle?: string;
}

export interface AITool {
  id: string;
  name: string;
  category: ToolCategory;
  url: string;
  downloadUrl?: string;
  logo: string;
  badge?: string;
  description: string;
  scope: CapabilityScope;
  freeTier: FreeTierDetails;
  quickSearchUrlTemplate?: string;
  tags: string[];
  isCustom?: boolean;
  isFavorite?: boolean;
  stars?: number;
  highlight?: boolean;
}

export interface StoredApiKey {
  id: string;
  provider: 'gemini' | 'openrouter' | 'groq' | 'deepseek' | 'openai' | 'anthropic' | 'mistral' | 'other';
  providerName: string;
  key: string;
  label: string;
  createdAt: string;
  freeTierNotes: string;
  getKeyUrl: string;
  lastTestedStatus?: 'valid' | 'invalid' | 'unknown';
  lastTestedMessage?: string;
  /** In-memory only: the encrypted token this key was stored as (see lib/secureKeys.ts). */
  blob?: string;
  /** In-memory only: the stored token could not be decrypted on this device. */
  undecryptable?: boolean;
}

export interface LocalServiceInfo {
  id: string;
  name: string;
  category: 'router' | 'runner' | 'ide';
  port: number;
  defaultUrl: string;
  healthEndpoint: string;
  status: 'online' | 'offline' | 'checking';
  latency?: number;
  description: string;
  commandToStart: string;
  installCommand?: string;
  docsUrl: string;
  modelCount?: number;
}

export type LocalServiceStatus = LocalServiceInfo;
