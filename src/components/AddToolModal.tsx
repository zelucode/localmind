import React, { useEffect, useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
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

type Field = 'name' | 'url' | 'downloadUrl' | 'description' | 'badge' | 'summary' | 'tags';
type FieldError = { field: Field; message: string };

const LIMITS = { name: 60, description: 300, badge: 40, summary: 200, tags: 8, tagLength: 24 };

const inputClass =
  'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] border bg-[var(--theme-raised)] border-[var(--theme-border)] text-[var(--theme-text)] placeholder:opacity-50 transition-shadow';
// Inside the raised free-tier panel, inputs use the card colour so they stand out.
const onRaised = '!bg-[var(--theme-card)]';
const invalidClass = 'border-rose-500/70';

function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const t of input.split(',')) {
    const tag = t.trim().toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

const Label: React.FC<{ htmlFor: string; optional?: boolean; children: React.ReactNode }> = ({
  htmlFor,
  optional,
  children,
}) => (
  <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--theme-text)' }}>
    {children}
    {optional ? (
      <span className="font-normal opacity-50">optional</span>
    ) : (
      <span aria-hidden="true" className="text-rose-400">
        *
      </span>
    )}
  </label>
);

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
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<FieldError | null>(null);

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
    setShowMore(false);
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const fail = (field: Field, message: string, optionalField = false) => {
    if (optionalField) setShowMore(true);
    setError({ field, message });
    requestAnimationFrame(() => document.getElementById(`field-${field}`)?.focus());
  };

  const clearOn = (field: Field) => (error?.field === field ? setError(null) : undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return fail('name', 'Give the tool a name.');
    if (name.trim().length > LIMITS.name) return fail('name', `Keep the name under ${LIMITS.name} characters.`);

    const checked = toWebUrl(url);
    if (checked.ok === false) return fail('url', checked.error);
    const formattedUrl = checked.url;

    const duplicate = existingTools.find((t) => normalizeUrl(t.url) === normalizeUrl(formattedUrl));
    if (duplicate) return fail('url', `"${duplicate.name}" already uses this link.`);

    let formattedDownload: string | undefined;
    if (downloadUrl.trim()) {
      const download = toWebUrl(downloadUrl);
      if (download.ok === false) return fail('downloadUrl', `Download link: ${download.error}`, true);
      formattedDownload = download.url;
    }

    if (description.trim().length > LIMITS.description)
      return fail('description', `Keep the description under ${LIMITS.description} characters.`, true);
    if (freeCreditValue.trim().length > LIMITS.badge)
      return fail('badge', `Keep the badge under ${LIMITS.badge} characters.`, true);
    if (freeQuotaSummary.trim().length > LIMITS.summary)
      return fail('summary', `Keep the explanation under ${LIMITS.summary} characters.`, true);

    const tags = parseTags(tagsInput);
    if (tags.length > LIMITS.tags) return fail('tags', `Use at most ${LIMITS.tags} tags.`, true);
    if (tags.some((t) => t.length > LIMITS.tagLength))
      return fail('tags', `Each tag must be under ${LIMITS.tagLength} characters.`, true);

    setError(null);

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

  const fieldError = (field: Field) =>
    error?.field === field ? (
      <p id={`error-${field}`} role="alert" className="mt-1.5 text-xs text-rose-400">
        {error.message}
      </p>
    ) : null;

  const fieldProps = (field: Field) => ({
    id: `field-${field}`,
    'aria-invalid': error?.field === field || undefined,
    'aria-describedby': error?.field === field ? `error-${field}` : undefined,
  });

  const checkbox = 'w-4 h-4 rounded cursor-pointer accent-[var(--theme-primary)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="modal-add-tool"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tool-title"
        className="border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="p-2 rounded-lg border shrink-0"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
            >
              <Plus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="add-tool-title" className="text-base font-semibold">
                Add a tool
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Only a name and a link are needed. Everything else is optional.
              </p>
            </div>
          </div>
          <button
            id="btn-close-add-modal"
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg transition-opacity cursor-pointer opacity-70 hover:opacity-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col min-h-0">
          <div className="p-6 overflow-y-auto space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-name">Name</Label>
                <input
                  {...fieldProps('name')}
                  type="text"
                  autoFocus
                  maxLength={LIMITS.name + 20}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearOn('name');
                  }}
                  placeholder="e.g. Cohere Command R+"
                  className={`${inputClass} ${error?.field === 'name' ? invalidClass : ''}`}
                />
                {fieldError('name')}
              </div>
              <div>
                <Label htmlFor="field-url">Website</Label>
                <input
                  {...fieldProps('url')}
                  type="text"
                  inputMode="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    clearOn('url');
                  }}
                  placeholder="example.com"
                  className={`${inputClass} font-mono ${error?.field === 'url' ? invalidClass : ''}`}
                />
                {fieldError('url')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-category" optional>
                  Category
                </Label>
                <select
                  id="field-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ToolCategory)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="web-llm">Web LLM & Search</option>
                  <option value="coding-agent">Coding & Local Agent</option>
                  <option value="design-media">Design & Media</option>
                  <option value="uniform-proxy">Uniform Router / Proxy</option>
                </select>
              </div>
              <div>
                <Label htmlFor="field-scope" optional>
                  Type
                </Label>
                <select
                  id="field-scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as CapabilityScope)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="web-only">Web only</option>
                  <option value="local-agent">Local desktop agent</option>
                  <option value="ide-plugin">IDE plugin / extension</option>
                  <option value="local-runner">Local runner (Ollama, LM Studio)</option>
                  <option value="uniform-proxy">Uniform proxy (OmniRoute, OpenRouter)</option>
                  <option value="cloud-builder">Cloud app builder</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="button"
                id="btn-toggle-more-details"
                onClick={() => setShowMore((v) => !v)}
                aria-expanded={showMore}
                className="flex items-center gap-1.5 text-xs font-medium cursor-pointer hover:opacity-80"
                style={{ color: 'var(--theme-primary)' }}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                {showMore ? 'Hide optional details' : 'Add optional details (description, free tier, tags)'}
              </button>

              {showMore && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="field-description" optional>
                      Description
                    </Label>
                    <textarea
                      {...fieldProps('description')}
                      rows={2}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        clearOn('description');
                      }}
                      placeholder="What does it do? Which models does it offer?"
                      className={`${inputClass} resize-none ${error?.field === 'description' ? invalidClass : ''}`}
                    />
                    {fieldError('description')}
                  </div>

                  <div>
                    <Label htmlFor="field-tags" optional>
                      Tags
                    </Label>
                    <input
                      {...fieldProps('tags')}
                      type="text"
                      value={tagsInput}
                      onChange={(e) => {
                        setTagsInput(e.target.value);
                        clearOn('tags');
                      }}
                      placeholder="coding, local, reasoning (comma separated)"
                      className={`${inputClass} ${error?.field === 'tags' ? invalidClass : ''}`}
                    />
                    {fieldError('tags')}
                  </div>

                  <div
                    className="p-4 rounded-xl border space-y-4"
                    style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
                  >
                    <span className="text-xs font-semibold block" style={{ color: 'var(--theme-primary)' }}>
                      Free tier
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="field-badge" optional>
                          Allowance badge
                        </Label>
                        <input
                          {...fieldProps('badge')}
                          type="text"
                          value={freeCreditValue}
                          onChange={(e) => {
                            setFreeCreditValue(e.target.value);
                            clearOn('badge');
                          }}
                          placeholder="e.g. 50 msgs/day, $5 credit"
                          className={`${inputClass} ${onRaised} ${error?.field === 'badge' ? invalidClass : ''}`}
                        />
                        {fieldError('badge')}
                      </div>
                      <div>
                        <Label htmlFor="field-downloadUrl" optional>
                          Download link
                        </Label>
                        <input
                          {...fieldProps('downloadUrl')}
                          type="text"
                          inputMode="url"
                          value={downloadUrl}
                          onChange={(e) => {
                            setDownloadUrl(e.target.value);
                            clearOn('downloadUrl');
                          }}
                          placeholder="https://.../download or GitHub releases"
                          className={`${inputClass} ${onRaised} font-mono ${error?.field === 'downloadUrl' ? invalidClass : ''}`}
                        />
                        {fieldError('downloadUrl')}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="field-summary" optional>
                        What you get for free
                      </Label>
                      <input
                        {...fieldProps('summary')}
                        type="text"
                        value={freeQuotaSummary}
                        onChange={(e) => {
                          setFreeQuotaSummary(e.target.value);
                          clearOn('summary');
                        }}
                        placeholder="e.g. Daily free renewal, no card required"
                        className={`${inputClass} ${onRaised} ${error?.field === 'summary' ? invalidClass : ''}`}
                      />
                      {fieldError('summary')}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className={checkbox}
                          checked={hasWebSearch}
                          onChange={(e) => setHasWebSearch(e.target.checked)}
                        />
                        Live web search
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className={checkbox}
                          checked={!creditCardRequired}
                          onChange={(e) => setCreditCardRequired(!e.target.checked)}
                        />
                        No credit card
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className={checkbox}
                          checked={allowCustomApiKey}
                          onChange={(e) => setAllowCustomApiKey(e.target.checked)}
                        />
                        Free API key
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className="px-6 py-4 flex items-center justify-end gap-2 border-t"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer hover:opacity-85"
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
              className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95 transition-transform"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              <Plus className="w-4 h-4" />
              Add tool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
