import React, { useState } from 'react';
import { X, Info, ShieldCheck, History, ChevronRight, ChevronDown } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { RELEASES } from '../data/releases';
import pkg from '../../package.json';

const isPrerelease = pkg.version.includes('-');

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  // The running version starts open; older versions start collapsed.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([pkg.version]));
  if (!isOpen) return null;

  const toggle = (version: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });

  return (
    <div
      id="modal-about"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="About LocalMind"
        className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Info className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
            About LocalMind
          </div>
          <button
            id="btn-close-about"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg cursor-pointer opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000)' }}
            >
              <BrandMark className="w-7 h-7" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight">LocalMind</div>
              <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Your private AI hub, always nearby.
              </div>
            </div>
          </div>

          <div
            className="rounded-xl border p-3 text-xs font-mono flex justify-between"
            style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
          >
            <span style={{ color: 'var(--theme-text-secondary)' }}>App version</span>
            <span style={{ color: 'var(--theme-primary)' }}>
              {pkg.version}
              {isPrerelease && <span className="ml-2 uppercase tracking-wider opacity-80">beta</span>}
            </span>
          </div>

          <div
            className="rounded-xl border p-3 text-xs space-y-1.5"
            style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
              Privacy
            </div>
            <p style={{ color: 'var(--theme-text-secondary)' }}>
              LocalMind has no account and no usage tracking. Your tools, bookmarks, API keys and settings are stored
              on this computer. Keys are only sent to a provider when you test them or use them with that provider.
            </p>
          </div>

          <section aria-label="What's New" className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <History className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
              What's New
            </div>
            <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              Highlights for each release. Older versions start collapsed.
            </p>
            <div className="space-y-2">
              {RELEASES.map((release) => {
                const open = expanded.has(release.version);
                const current = release.version === pkg.version;
                return (
                  <div
                    key={release.version}
                    className="rounded-xl border"
                    style={{
                      backgroundColor: current ? 'var(--theme-raised)' : 'transparent',
                      borderColor: current ? 'var(--theme-primary)' : 'var(--theme-border)',
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggle(release.version)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs cursor-pointer"
                    >
                      {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                      <span className="font-mono font-bold">v{release.version}</span>
                      {current && (
                        <span
                          className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                          style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000)' }}
                        >
                          This version
                        </span>
                      )}
                      <span className="flex-1 truncate" style={{ color: 'var(--theme-text-secondary)' }}>
                        {release.title}
                      </span>
                      <span className="font-mono text-[10px] opacity-60">{release.date}</span>
                    </button>
                    {open && (
                      <ul
                        className="px-4 pb-3 pt-0.5 space-y-1.5 text-xs list-disc list-inside"
                        style={{ color: 'var(--theme-text-secondary)' }}
                      >
                        {release.highlights.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
