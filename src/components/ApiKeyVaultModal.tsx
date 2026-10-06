import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Code2
} from 'lucide-react';
import { StoredApiKey } from '../types';
import { POPULAR_API_PROVIDERS } from '../data/providers';
import { verifyApiKey, VerifyStatus } from '../lib/backend';
import { keyProblem } from '../lib/secureKeys';

interface ApiKeyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: StoredApiKey[];
  onAddKey: (key: StoredApiKey) => void;
  onDeleteKey: (id: string) => void;
  onOpenConfigExporter?: (provider?: string) => void;
  /** Called after a key was checked against its provider. */
  onKeyTested?: (id: string, status: 'valid' | 'invalid' | 'unknown') => void;
  /** Shown when keys could not be saved securely. */
  storageError?: string | null;
  /** Render as a normal page section (no overlay, no close button). */
  inline?: boolean;
}

export const ApiKeyVaultModal: React.FC<ApiKeyVaultModalProps> = ({
  isOpen,
  onClose,
  inline = false,
  keys,
  onAddKey,
  onDeleteKey,
  onOpenConfigExporter,
  onKeyTested,
  storageError,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<StoredApiKey['provider']>('gemini');
  const [keyInput, setKeyInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<Record<string, { status: VerifyStatus; message: string }>>({});

  if (!isOpen && !inline) return null;

  const currentProviderConfig = POPULAR_API_PROVIDERS.find((p) => p.provider === selectedProvider) || POPULAR_API_PROVIDERS[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    const newKey: StoredApiKey = {
      id: `key_${Date.now()}`,
      provider: selectedProvider,
      providerName: currentProviderConfig.name,
      key: keyInput.trim(),
      label: labelInput.trim() || `${currentProviderConfig.name} Key`,
      createdAt: new Date().toLocaleDateString(),
      freeTierNotes: currentProviderConfig.freeQuota,
      getKeyUrl: currentProviderConfig.getKeyUrl,
      lastTestedStatus: 'unknown',
    };

    onAddKey(newKey);
    setKeyInput('');
    setLabelInput('');
  };

  const toggleShow = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const testKey = async (keyItem: StoredApiKey) => {
    setIsVerifying(keyItem.id);
    try {
      const result = await verifyApiKey(keyItem.provider, keyItem.key);
      setVerificationFeedback((prev) => ({ ...prev, [keyItem.id]: result }));
      if (result.status === 'valid') onKeyTested?.(keyItem.id, 'valid');
      else if (result.status === 'invalid') onKeyTested?.(keyItem.id, 'invalid');
    } catch (err) {
      setVerificationFeedback((prev) => ({
        ...prev,
        [keyItem.id]: {
          status: 'error',
          message: err instanceof Error ? err.message : 'Could not verify the key.',
        },
      }));
    } finally {
      setIsVerifying(null);
    }
  };

  return (
    <div className={inline ? '' : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'}>
      <div
        id="modal-key-vault"
        className={`border rounded-2xl w-full flex flex-col overflow-hidden transition-colors ${inline ? 'max-w-4xl mx-auto' : 'max-w-2xl max-h-[90vh] shadow-2xl'}`}
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>
                API Key Vault & Free Credit Tracker
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Keys are encrypted on this device. The master key is held in your operating system's credential store.
              </p>
            </div>
          </div>
          <button
            id="btn-close-key-vault"
            onClick={onClose}
            className={`${inline ? 'hidden ' : ''}p-1.5 rounded-lg transition-colors cursor-pointer opacity-70 hover:opacity-100`}
            style={{ color: 'var(--theme-text)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {storageError && (
            <div
              role="alert"
              className="text-xs px-3 py-2 rounded-lg flex items-start gap-2 font-medium border bg-rose-500/10 text-rose-500 border-rose-500/20"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{storageError}</span>
            </div>
          )}
          {/* Add Key Form */}
          <div
            className="border rounded-xl p-4"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--theme-primary)' }}>
              <Plus className="w-3.5 h-3.5" /> Add New API Key
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--theme-text)' }}>
                  Select AI Provider:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {POPULAR_API_PROVIDERS.map((p) => {
                    const isSelected = selectedProvider === p.provider;
                    return (
                      <button
                        key={p.provider}
                        type="button"
                        onClick={() => setSelectedProvider(p.provider)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left truncate transition-colors cursor-pointer"
                        style={
                          isSelected
                            ? {
                                backgroundColor: 'var(--theme-primary)',
                                color: 'var(--theme-primary-foreground, #000000)',
                                borderColor: 'var(--theme-primary)',
                              }
                            : {
                                backgroundColor: 'var(--theme-card)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-text-secondary)',
                              }
                        }
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider Free Tier Banner & Direct Link */}
              <div
                className="p-2.5 rounded-lg border flex items-center justify-between text-xs gap-2"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div style={{ color: 'var(--theme-text)' }}>
                  <span className="font-semibold text-emerald-500 mr-1">Free Allowance:</span>
                  {currentProviderConfig.freeQuota}
                </div>
                <a
                  href={currentProviderConfig.getKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  Get Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                    Label / Description (Optional):
                  </label>
                  <input
                    id="input-key-label"
                    type="text"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    placeholder="e.g. My Free Gemini Dev Key"
                    className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                    style={{
                      backgroundColor: 'var(--theme-card)',
                      borderColor: 'var(--theme-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--theme-text)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                    API Key:
                  </label>
                  <input
                    id="input-key-value"
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Paste your API key here..."
                    className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none font-mono"
                    style={{
                      backgroundColor: 'var(--theme-card)',
                      borderColor: 'var(--theme-border)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: 'var(--theme-text)',
                    }}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  id="btn-save-api-key"
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary-foreground, #000000)',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Save to Local Vault
                </button>
              </div>
            </form>
          </div>

          {/* Stored Keys List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>
                Configured Keys ({keys.length})
              </h3>
              <span className="text-[11px] flex items-center gap-1 text-emerald-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Stored locally in browser
              </span>
            </div>

            {keys.length === 0 ? (
              <div
                className="text-center py-8 px-4 rounded-xl border border-dashed text-xs"
                style={{
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-muted)',
                }}
              >
                No API keys saved yet. Add your free Google Gemini or Groq key above to test!
              </div>
            ) : (
              <div className="space-y-2.5">
                {keys.map((k) => {
                  const isRevealed = showKeys[k.id];
                  const feedback = verificationFeedback[k.id];
                  return (
                    <div
                      key={k.id}
                      className="p-3.5 rounded-xl border flex flex-col gap-2"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold truncate" style={{ color: 'var(--theme-text)' }}>
                            {k.label}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-medium border"
                            style={{
                              backgroundColor: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--theme-primary)',
                            }}
                          >
                            {k.providerName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => testKey(k)}
                            disabled={isVerifying === k.id || !k.key}
                            className="px-2 py-1 text-[11px] rounded border transition-colors flex items-center gap-1 cursor-pointer hover:opacity-85"
                            style={{
                              backgroundColor: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--theme-text)',
                            }}
                            title="Test key connection"
                          >
                            <RefreshCw className={`w-3 h-3 ${isVerifying === k.id ? 'animate-spin' : ''}`} style={{ color: 'var(--theme-primary)' }} />
                            Test
                          </button>

                          {onOpenConfigExporter && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenConfigExporter(k.provider);
                              }}
                              className="px-2 py-1 text-[11px] font-medium rounded border transition-colors flex items-center gap-1 cursor-pointer hover:opacity-85"
                              style={{
                                backgroundColor: 'var(--theme-raised)',
                                borderColor: 'var(--theme-border)',
                                color: 'var(--theme-primary)',
                              }}
                              title="Export IDE config for this key (Cline, Continue, Cursor, etc.)"
                            >
                              <Code2 className="w-3 h-3" />
                              Export IDE Config
                            </button>
                          )}

                          <button
                            onClick={() => toggleShow(k.id)}
                            className="p-1 rounded border transition-colors cursor-pointer hover:opacity-85"
                            style={{
                              backgroundColor: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--theme-text-muted)',
                            }}
                            title={isRevealed ? 'Hide Key' : 'Reveal Key'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => copyKey(k.key, k.id)}
                            className="p-1 rounded border transition-colors cursor-pointer hover:opacity-85"
                            style={{
                              backgroundColor: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--theme-text-muted)',
                            }}
                            title="Copy Key"
                          >
                            {copiedId === k.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => onDeleteKey(k.id)}
                            className="p-1 text-rose-500 rounded border transition-colors cursor-pointer hover:opacity-85"
                            style={{
                              backgroundColor: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                            }}
                            title="Delete Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Key Value Field */}
                      <div
                        className="px-2.5 py-1.5 rounded border font-mono text-xs flex items-center justify-between"
                        style={{
                          backgroundColor: 'var(--theme-card)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text-secondary)',
                        }}
                      >
                        <span className="truncate">
                          {isRevealed ? k.key : `••••••••••••••••••••••••••••${k.key.slice(-4)}`}
                        </span>
                        <span className="text-[10px] shrink-0 ml-2" style={{ color: 'var(--theme-text-muted)' }}>
                          Added {k.createdAt}
                        </span>
                      </div>

                      {keyProblem(k) && (
                        <div
                          role="alert"
                          className="text-xs px-2.5 py-1 rounded flex items-center gap-1.5 font-medium border bg-amber-500/10 text-amber-500 border-amber-500/20"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{keyProblem(k)}</span>
                        </div>
                      )}

                      {/* Verification Feedback Banner */}
                      {feedback && (
                        <div
                          role="status"
                          className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 font-medium border ${
                            feedback.status === 'valid'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : feedback.status === 'invalid'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {feedback.status === 'valid' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{feedback.message}</span>
                        </div>
                      )}

                      {/* Free Tier Details */}
                      {k.freeTierNotes && (
                        <div className="text-[11px] flex items-center justify-between" style={{ color: 'var(--theme-text-muted)' }}>
                          <span>Allowance: {k.freeTierNotes}</span>
                          {k.getKeyUrl && (
                            <a
                              href={k.getKeyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-0.5"
                              style={{ color: 'var(--theme-primary)' }}
                            >
                              Console <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* OmniRoute Tip */}
          <div
            className="p-3.5 rounded-xl border text-xs flex items-start gap-2.5"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-secondary)',
            }}
          >
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--theme-primary)' }} />
            <div>
              <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                Pro Tip: Combine keys with OmniRoute!
              </span>
              <p className="mt-0.5 leading-relaxed">
                By exporting your free Gemini and Groq keys into your local OmniRoute config, OmniRoute will automatically load-balance queries across free allowances and prevent rate-limit throttling in IDEs like Cursor or Aider.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
