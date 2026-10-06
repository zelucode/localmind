import React, { useEffect, useState } from 'react';
import { X, Plus, Globe, Terminal, Palette, Network, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AITool, CapabilityScope, ToolCategory } from '../types';
import { toWebUrl } from '../lib/url';
import { normalizeUrl } from '../lib/bookmarkTransfer';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTool: (tool: AITool) => void;
  /** Tools already in the catalog, used to warn about a link that is already there. */
  existingTools?: AITool[];
}

export const AddToolModal: React.FC<AddToolModalProps> = ({
  isOpen,
  onClose,
  onAddTool,
  existingTools = [],
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [category, setCategory] = useState<ToolCategory>('web-llm');
  const [scope, setScope] = useState<CapabilityScope>('web-only');
  const [description, setDescription] = useState('');
  const [freeQuotaSummary, setFreeQuotaSummary] = useState('');
  const [freeCreditValue, setFreeCreditValue] = useState('');
  const [hasWebSearch, setHasWebSearch] = useState(false);
  const [creditCardRequired, setCreditCardRequired] = useState(false);
  const [allowCustomApiKey, setAllowCustomApiKey] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Start every opening with an empty form (the component stays mounted while closed).
  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setUrl('');
    setDownloadUrl('');
    setCategory('web-llm');
    setScope('web-only');
    setDescription('');
    setFreeQuotaSummary('');
    setFreeCreditValue('');
    setHasWebSearch(false);
    setCreditCardRequired(false);
    setAllowCustomApiKey(false);
    setTagsInput('');
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const checked = toWebUrl(url);
    if ('error' in checked) {
      setError(checked.error);
      return;
    }
    const formattedUrl = checked.url;

    let formattedDownload: string | undefined;
    if (downloadUrl.trim()) {
      const download = toWebUrl(downloadUrl);
      if ('error' in download) {
        setError(`Download link: ${download.error}`);
        return;
      }
      formattedDownload = download.url;
    }

    const duplicate = existingTools.find((t) => normalizeUrl(t.url) === normalizeUrl(formattedUrl));
    if (duplicate) {
      setError(`"${duplicate.name}" already uses this link.`);
      return;
    }
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const newTool: AITool = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      category,
      scope,
      url: formattedUrl,
      downloadUrl: formattedDownload,
      logo: 'Globe',
      badge: 'User Added',
      description: description.trim() || 'Custom AI tool added by you.',
      tags: tags.length > 0 ? tags : ['custom', 'ai-tool'],
      isCustom: true,
      freeTier: {
        summary: freeQuotaSummary.trim() || 'No free-tier details added.',
        hasWebSearch,
        creditCardRequired,
        allowCustomApiKey,
        limits: 'User configured',
        freeCreditValue: freeCreditValue.trim() || 'Not specified',
      },
    };

    onAddTool(newTool);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="modal-add-tool"
        className="border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
            >
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>
                Add Custom AI Platform or Link
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Bookmark any new LLM, local agent, or tool with free quota tracking.
              </p>
            </div>
          </div>
          <button
            id="btn-close-add-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer opacity-70 hover:opacity-100"
            style={{ color: 'var(--theme-text)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Tool / Platform Name: *
              </label>
              <input
                id="input-tool-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cohere Command R+, DeepLX, etc."
                className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'var(--theme-text)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Website URL: *
              </label>
              <input
                id="input-tool-url"
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none font-mono"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ToolCategory)}
                className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'var(--theme-text)',
                }}
              >
                <option value="web-llm">Web LLM & Search</option>
                <option value="coding-agent">Coding & Local Agent</option>
                <option value="design-media">Design & Media</option>
                <option value="uniform-proxy">Uniform Router / Proxy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Architecture & Scope:
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as CapabilityScope)}
                className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'var(--theme-text)',
                }}
              >
                <option value="web-only">Web Only (Cannot edit local files)</option>
                <option value="local-agent">Local Desktop Agent (Edits local files)</option>
                <option value="ide-plugin">IDE Plugin / Extension (VSCode/JetBrains)</option>
                <option value="local-runner">Local Runner (Ollama/LM Studio offline)</option>
                <option value="uniform-proxy">Uniform Proxy (OmniRoute/OpenRouter)</option>
                <option value="cloud-builder">Cloud App Builder (Full stack online)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
              Description:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this AI tool do? What models does it provide?"
              className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none resize-none"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: 'var(--theme-text)',
              }}
            />
          </div>

          {/* Free Tier Info */}
          <div
            className="p-3.5 rounded-xl border space-y-3"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <span className="text-xs font-semibold block" style={{ color: 'var(--theme-primary)' }}>
              Free Tier & Allowance Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                  Allowance Badge (e.g. "Free 50 msgs/day", "$5 credit"):
                </label>
                <input
                  type="text"
                  value={freeCreditValue}
                  onChange={(e) => setFreeCreditValue(e.target.value)}
                  placeholder="e.g. Free Tier, 20 queries/day"
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
                  Download URL (Optional for Desktop/CLI):
                </label>
                <input
                  type="text"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://.../download or GitHub releases"
                  className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none font-mono"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
                Free Allowance Explanation:
              </label>
              <input
                type="text"
                value={freeQuotaSummary}
                onChange={(e) => setFreeQuotaSummary(e.target.value)}
                placeholder="e.g. Daily free renewal on Sonnet 3.5 without card required"
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

            {/* Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs" style={{ color: 'var(--theme-text)' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasWebSearch}
                  onChange={(e) => setHasWebSearch(e.target.checked)}
                  className="rounded border"
                />
                <span>Live Web Search</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!creditCardRequired}
                  onChange={(e) => setCreditCardRequired(!e.target.checked)}
                  className="rounded border"
                />
                <span>No Credit Card</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCustomApiKey}
                  onChange={(e) => setAllowCustomApiKey(e.target.checked)}
                  className="rounded border"
                />
                <span>Free API Key</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
              Tags (comma separated):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. coding, local, free-tier, reasoning"
              className="w-full px-3 py-1.5 rounded-lg text-xs focus:outline-none"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: 'var(--theme-text)',
              }}
            />
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:opacity-85"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            >
              Cancel
            </button>
            <button
              id="btn-submit-add-tool"
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
