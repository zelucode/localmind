import React, { useState, useMemo } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  Eye,
  EyeOff,
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
import { openExternal } from '../lib/tauri';
import { TargetToolId, buildConfigSnippet } from '../lib/configSnippet';
import { PROVIDER_PRESETS } from '../data/providers';

interface IDEConfigExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedKeys: StoredApiKey[];
  onSaveKey?: (key: StoredApiKey) => void;
  initialProvider?: string;
  /** Render as a normal page section (no overlay, no close buttons). */
  inline?: boolean;
}

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

const KEY_MASK = '••••••••••••••••';

export const IDEConfigExporterModal: React.FC<IDEConfigExporterModalProps> = ({
  isOpen,
  onClose,
  inline = false,
  savedKeys,
  onSaveKey,
  initialProvider,
}) => {
  const [selectedToolId, setSelectedToolId] = useState<TargetToolId>('continue');
  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => {
    return PROVIDER_PRESETS.some((p) => p.id === initialProvider) ? initialProvider! : 'gemini';
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return (PROVIDER_PRESETS.find((p) => p.id === initialProvider) ?? PROVIDER_PRESETS[0]).defaultModel;
  });
  const [useRealKey, setUseRealKey] = useState<boolean>(true);
  const [manualKeyInput, setManualKeyInput] = useState<string>('');
  // Secrets stay masked on screen until the user asks to see them; copying always uses the real value.
  const [revealManualKey, setRevealManualKey] = useState<boolean>(false);
  const [revealConfig, setRevealConfig] = useState<boolean>(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  // Sync provider change
  const currentProvider = useMemo(() => {
    return PROVIDER_PRESETS.find((p) => p.id === selectedProviderId) || PROVIDER_PRESETS[0];
  }, [selectedProviderId]);

  // Sync default model when provider changes
  const handleSelectProvider = (provId: string) => {
    setSelectedProviderId(provId);
    setRevealConfig(false);
    setRevealManualKey(false);
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

  // True when the snippet embeds a real key (not a placeholder or the dummy local key).
  const hasSecret = useRealKey && Boolean(manualKeyInput.trim() || matchedVaultKey?.key);

  const generatedSnippet = useMemo(
    () => buildConfigSnippet({ toolId: selectedToolId, provider: currentProvider, model: selectedModel, key: activeKeyString }),
    [selectedToolId, currentProvider, selectedModel, activeKeyString],
  );

  const displaySnippet = useMemo(
    () => (hasSecret && !revealConfig
      ? buildConfigSnippet({ toolId: selectedToolId, provider: currentProvider, model: selectedModel, key: KEY_MASK })
      : generatedSnippet),
    [hasSecret, revealConfig, selectedToolId, currentProvider, selectedModel, generatedSnippet],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedSnippet);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    setTimeout(() => setCopyState('idle'), 2000);
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

  if (!isOpen && !inline) return null;

  return (
    <div
      id="modal-ide-exporter-backdrop"
      className={inline ? '' : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto backdrop-blur-sm transition-opacity animate-in fade-in'}
      style={inline ? undefined : { backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        id="modal-ide-exporter-content"
        className={`w-full rounded-2xl border overflow-hidden flex flex-col transition-all ${inline ? '' : 'max-w-4xl shadow-2xl my-auto'}`}
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
            className={`${inline ? 'hidden ' : ''}p-2 rounded-xl border transition-colors cursor-pointer hover:opacity-80`}
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
        <div className={`p-5 sm:p-6 space-y-6 ${inline ? '' : 'overflow-y-auto max-h-[80vh]'}`}>
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
                    onClick={(e) => {
                      e.preventDefault();
                      void openExternal(currentProvider.getKeyUrl);
                    }}
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
                    <div className="relative w-full">
                      <input
                        type={revealManualKey ? 'text' : 'password'}
                        value={manualKeyInput}
                        onChange={(e) => setManualKeyInput(e.target.value)}
                        placeholder={`Paste your ${currentProvider.name} key here to inject...`}
                        aria-label={`${currentProvider.name} API key`}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border font-mono focus:outline-none"
                        style={{
                          backgroundColor: 'var(--theme-card)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setRevealManualKey((v) => !v)}
                        aria-label={revealManualKey ? 'Hide key' : 'Show key'}
                        title={revealManualKey ? 'Hide key' : 'Show key'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer hover:opacity-80"
                        style={{ color: 'var(--theme-text-muted)' }}
                      >
                        {revealManualKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
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
              <div className="flex items-center gap-2">
              {hasSecret && (
                <button
                  id="btn-toggle-config-secret"
                  type="button"
                  onClick={() => setRevealConfig((v) => !v)}
                  aria-label={revealConfig ? 'Hide key in config' : 'Show key in config'}
                  title={revealConfig ? 'Hide key in config' : 'Show key in config'}
                  className="p-1.5 rounded-lg border cursor-pointer hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  {revealConfig ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                id="btn-copy-generated-config"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                style={{
                  backgroundColor: copyState === 'copied' ? '#10b981' : copyState === 'failed' ? '#ef4444' : 'var(--theme-primary)',
                  color: copyState === 'idle' ? 'var(--theme-primary-foreground, #000000)' : '#ffffff',
                }}
              >
                {copyState === 'copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyState === 'copied' ? 'Copied to Clipboard!' : copyState === 'failed' ? 'Copy failed: select the text manually' : 'Copy Config'}</span>
              </button>
              </div>
            </div>

            {hasSecret && !revealConfig && (
              <p className="text-[11px] mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                Your key is hidden here. <strong>Copy Config</strong> still copies the real key; use the eye to view it.
              </p>
            )}

            <div
              className="rounded-xl border p-4 font-mono text-xs overflow-x-auto relative"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderColor: 'var(--theme-border)',
                color: '#e2e8f0',
                lineHeight: 1.6,
              }}
            >
              <pre className="whitespace-pre-wrap">{displaySnippet}</pre>
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
            className={`${inline ? 'hidden ' : ''}px-4 py-1.5 rounded-lg border text-xs font-medium cursor-pointer hover:opacity-85`}
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
