import React from 'react';
import { X, Keyboard, Command, Sparkles } from 'lucide-react';
import { FEATURES } from '../config/features';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'navigation' | 'tools' | 'workspace';
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation & Search
  { keys: ['⌘K / Ctrl+K'], description: 'Open Global Search Command Palette (Find pages, tools, bookmarks & actions)', category: 'navigation' },
  { keys: ['1'], description: 'Go to Home', category: 'navigation' },
  { keys: ['2'], description: 'Go to AI Tools', category: 'navigation' },
  { keys: ['3'], description: 'Go to Bookmarks', category: 'navigation' },
  { keys: ['4'], description: 'Go to Runtimes (OmniRoute & local daemons)', category: 'navigation' },
  { keys: ['5'], description: 'Go to Configs & Limits', category: 'navigation' },
  { keys: ['6'], description: 'Go to Setup (one-click install of free tools)', category: 'navigation' },
  { keys: ['7'], description: 'Go to Key Vault', category: 'navigation' },
  { keys: ['8'], description: 'Go to Settings', category: 'navigation' },
  { keys: ['/'], description: 'Quick-focus search bar on active page', category: 'navigation' },

  // Tools & Modals
  { keys: ['k'], description: 'Go to Key Vault', category: 'tools' },
  { keys: ['c'], description: 'Go to the IDE & Agent Config Exporter (.cursorrules, Continue, Cline)', category: 'tools' },
  { keys: ['l'], description: 'Go to the Rate-Limit & Rotation Matrix', category: 'tools' },
  { keys: ['b'], description: 'Add New Custom Tool or Bookmark', category: 'tools' },

  // Workspace
  { keys: ['?'], description: 'Show this Keyboard Shortcuts cheat-sheet', category: 'workspace' },
  { keys: ['t'], description: 'Toggle Theme between Light and Dark mode', category: 'workspace' },
  { keys: ['Esc'], description: 'Close any open dialog, modal, or overlay', category: 'workspace' },
];

if (FEATURES.advisor) {
  SHORTCUTS.push({ keys: ['a'], description: 'Open AI Assistant & Architecture Advisor', category: 'tools' });
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = [
    { id: 'navigation', title: 'Navigation & View Switching' },
    { id: 'tools', title: 'Utilities' },
    { id: 'workspace', title: 'System & Global Hotkeys' },
  ] as const;

  return (
    <div
      id="modal-keyboard-shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
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
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl shadow-xs"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                Keyboard Shortcuts
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Power-user hotkeys for swift navigation & command access
              </p>
            </div>
          </div>

          <button
            id="btn-close-shortcuts-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-muted)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {categories.map((cat) => {
            const items = SHORTCUTS.filter((s) => s.category === cat.id);
            if (items.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2.5">
                <h3
                  className="text-xs font-bold uppercase tracking-wider opacity-70"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  {cat.title}
                </h3>

                <div
                  className="rounded-xl border divide-y overflow-hidden"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2.5 flex items-center justify-between gap-4 text-xs"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <span style={{ color: 'var(--theme-text)' }}>{item.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, kidx) => (
                          <kbd
                            key={kidx}
                            className="px-2 py-1 rounded-md text-[11px] font-mono font-bold border shadow-xs min-w-[24px] text-center"
                            style={{
                              backgroundColor: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                              color: 'var(--theme-primary)',
                            }}
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Quick Tip Box */}
          <div
            className="p-3.5 rounded-xl border flex items-start gap-3 text-xs"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-secondary)',
            }}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono">?</kbd> anywhere
              outside of input boxes to quickly bring up this cheatsheet.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex justify-end"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
