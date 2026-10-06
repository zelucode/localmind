import React, { useState, useEffect } from 'react';
import { X, Bookmark, Globe, Sparkles, Wrench, Tag, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ToolBookmark, BookmarkCategory } from '../types';
import { toWebUrl } from '../lib/url';
import { normalizeUrl } from '../lib/bookmarkTransfer';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBookmark: (bookmark: ToolBookmark) => void;
  bookmarkToEdit?: ToolBookmark | null;
  /** Bookmarks already saved, used to warn about a link that is already there. */
  existingBookmarks?: ToolBookmark[];
}

const CATEGORY_OPTIONS: { id: BookmarkCategory; label: string }[] = [
  { id: 'developer', label: 'Developer & Code' },
  { id: 'design', label: 'Design & Graphics' },
  { id: 'converters', label: 'Converters & Data' },
  { id: 'ai-utilities', label: 'AI Web Utilities' },
  { id: 'productivity', label: 'Productivity & Office' },
  { id: 'utilities', label: 'General Utilities' },
  { id: 'security', label: 'Security & Privacy' },
  { id: 'education', label: 'Learning & Practice' },
  { id: 'media', label: 'Audio & Video Media' },
  { id: 'custom', label: 'Other / Custom' },
];

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onSaveBookmark,
  bookmarkToEdit,
  existingBookmarks = [],
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BookmarkCategory>('developer');
  const [isAi, setIsAi] = useState(false);
  const [freeTierBadge, setFreeTierBadge] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookmarkToEdit) {
      setTitle(bookmarkToEdit.title);
      setUrl(bookmarkToEdit.url);
      setDescription(bookmarkToEdit.description);
      setCategory(bookmarkToEdit.category);
      setIsAi(bookmarkToEdit.isAi);
      setFreeTierBadge(bookmarkToEdit.freeTierBadge || '');
      setTagsInput(bookmarkToEdit.tags ? bookmarkToEdit.tags.join(', ') : '');
      setNotes(bookmarkToEdit.notes || '');
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setCategory('developer');
      setIsAi(false);
      setFreeTierBadge('');
      setTagsInput('');
      setNotes('');
    }
    setError(null);
  }, [bookmarkToEdit, isOpen]);

  // Quick auto-populate helper if user pastes a URL
  const handleUrlBlur = () => {
    if (!url.trim()) return;
    // An invalid address is reported on submit, not while the user is still typing.
    const checked = toWebUrl(url);
    if ('error' in checked) return;
    if (checked.url !== url.trim()) setUrl(checked.url);
    if (!title) {
      // Derive clean title from hostname (e.g. "jsoncrack.com" -> "Jsoncrack")
      const hostParts = new URL(checked.url).hostname.replace('www.', '').split('.');
      if (hostParts.length > 0 && hostParts[0]) {
        setTitle(hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a tool title.');
      return;
    }

    const checked = toWebUrl(url);
    if ('error' in checked) {
      setError(checked.error);
      return;
    }
    const finalUrl = checked.url;

    const duplicate = existingBookmarks.find(
      (b) => b.id !== bookmarkToEdit?.id && normalizeUrl(b.url) === normalizeUrl(finalUrl),
    );
    if (duplicate) {
      setError(`"${duplicate.title}" is already in your bookmarks with this link.`);
      return;
    }

    if (!description.trim()) {
      setError('Please write a brief summary of what this tool does.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newBookmark: ToolBookmark = {
      // Editing keeps everything the form does not show (GitHub link, stars, license, ...).
      ...bookmarkToEdit,
      id: bookmarkToEdit?.id || `bm-custom-${Date.now()}`,
      title: title.trim(),
      url: finalUrl,
      description: description.trim(),
      category,
      isAi,
      freeTierBadge: freeTierBadge.trim() || 'Free Web Tool',
      tags: parsedTags.length > 0 ? parsedTags : ['free-tool', category],
      isFavorite: bookmarkToEdit?.isFavorite ?? false,
      clickCount: bookmarkToEdit?.clickCount ?? 0,
      createdAt: bookmarkToEdit?.createdAt || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      isCustom: bookmarkToEdit ? bookmarkToEdit.isCustom : true,
    };

    onSaveBookmark(newBookmark);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-add-bookmark"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-raised)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {bookmarkToEdit ? 'Edit Tool Bookmark' : 'Bookmark Free Online Tool'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Save any AI or non-AI web tool for 1-click access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-75"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-card)',
              color: 'var(--theme-text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
              Tool Website URL <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="text"
                placeholder="https://example.com/tool"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
                required
              />
            </div>
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
                Tool Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ray.so, Regex101"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BookmarkCategory)}
                className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI vs Non-AI Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--theme-text)' }}>
              Tool Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsAi(false)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  !isAi ? 'ring-2 font-semibold' : 'opacity-65 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: !isAi ? 'var(--theme-raised)' : 'transparent',
                  borderColor: !isAi ? 'var(--theme-primary)' : 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span>Non-AI Web Utility</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAi(true)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isAi ? 'ring-2 font-semibold' : 'opacity-65 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isAi ? 'var(--theme-raised)' : 'transparent',
                  borderColor: isAi ? 'var(--theme-primary)' : 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Free AI Utility</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
              Description / Use Case <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="What does this tool do and why is it useful?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 resize-none"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              required
            />
          </div>

          {/* Free Badge & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
                Free Tier Badge
              </label>
              <input
                type="text"
                placeholder="e.g. Free • No sign-up (leave empty for Free Web Tool)"
                value={freeTierBadge}
                onChange={(e) => setFreeTierBadge(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
                Tags (comma separated)
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  placeholder="regex, testing, format"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--theme-text)' }}>
              Personal Notes & Tips (Optional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 absolute left-3 top-3 opacity-40" />
              <textarea
                rows={2}
                placeholder="e.g. Press spacebar to cycle, supports dark mode exports..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 resize-none"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer hover:opacity-75"
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-raised)',
                color: 'var(--theme-text)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{bookmarkToEdit ? 'Save Changes' : 'Bookmark Tool'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
