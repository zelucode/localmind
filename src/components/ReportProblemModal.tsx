import React, { useEffect, useState } from 'react';
import { X, Bug, FolderOpen, Save, ShieldCheck } from 'lucide-react';
import { getLogInfo, previewDiagnostics, saveDiagnostics, type LogInfo } from '../lib/backend';
import { revealInFolder } from '../lib/tauri';
import { CopyStatusIcon, useCopyFeedback } from '../lib/useCopy';
import { logWarn } from '../lib/errorLog';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');

/**
 * Report a Problem: shows exactly what a diagnostics file contains (app version, OS, recent app.log
 * lines with keys blanked), lets the user save it, and points to the log folder. Nothing is sent anywhere.
 */
export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [logInfo, setLogInfo] = useState<LogInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ path: string } | { error: string } | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const { copy, statusOf } = useCopyFeedback();

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setPreview(null);
    setLogInfo(null);
    setLoadError(null);
    setSaved(null);
    setRevealError(null);
    previewDiagnostics()
      .then((text) => !cancelled && setPreview(text))
      .catch((err) => !cancelled && setLoadError(message(err)));
    getLogInfo()
      .then((info) => !cancelled && setLogInfo(info))
      .catch(() => {}); // the preview error already explains why nothing is available
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setRevealError(null);
    try {
      setSaved({ path: await saveDiagnostics() });
    } catch (err) {
      logWarn('report', 'Saving the diagnostics file failed', err);
      setSaved({ error: message(err) });
    }
  };

  const reveal = async (path: string) => {
    setRevealError(null);
    try {
      await revealInFolder(path);
    } catch (err) {
      setRevealError(message(err));
    }
  };

  return (
    <div
      id="modal-report-problem"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Report a Problem"
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bug className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
            Report a Problem
          </div>
          <button id="btn-close-report" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg cursor-pointer opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            LocalMind keeps a log of what happened (<code>app.log</code>, written by both the app and its background service). If something
            is wrong, save the diagnostic file below and attach it when you report the problem. <strong>Nothing is sent anywhere
            automatically.</strong>
          </p>

          <div
            className="rounded-xl border p-3 text-xs space-y-1"
            style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
              What the file contains
            </div>
            <p style={{ color: 'var(--theme-text-secondary)' }}>
              App version, operating system and the most recent log lines. API keys and tokens are blanked. It does not contain your keys,
              tools, bookmarks, settings or file paths.
            </p>
          </div>

          {loadError && (
            <p role="alert" className="text-xs text-rose-500 font-medium">
              {loadError}
            </p>
          )}

          {preview !== null && (
            <div className="space-y-1.5">
              <label htmlFor="diagnostics-preview" className="text-xs font-semibold block">
                Preview of the file
              </label>
              <textarea
                id="diagnostics-preview"
                readOnly
                value={preview}
                rows={12}
                className="w-full font-mono text-[11px] p-3 rounded-xl focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'var(--theme-text)',
                }}
              />
            </div>
          )}

          {saved && 'path' in saved && (
            <div role="status" className="text-xs space-y-1.5">
              <p className="text-emerald-500 font-medium">Saved to {saved.path}</p>
              <button
                type="button"
                onClick={() => void reveal(saved.path)}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 cursor-pointer hover:opacity-85"
                style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
              >
                <FolderOpen className="w-3 h-3" />
                Show in folder
              </button>
            </div>
          )}
          {saved && 'error' in saved && (
            <p role="alert" className="text-xs text-rose-500 font-medium">
              {saved.error}
            </p>
          )}
          {revealError && (
            <p role="alert" className="text-xs text-rose-500 font-medium">
              {revealError}
            </p>
          )}
        </div>

        <div
          className="px-5 py-3 border-t flex flex-wrap items-center gap-2 shrink-0"
          style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
        >
          <button
            id="btn-save-diagnostics"
            type="button"
            onClick={() => void handleSave()}
            disabled={preview === null}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000000)' }}
          >
            <Save className="w-3.5 h-3.5" />
            Save diagnostic file
          </button>
          <button
            type="button"
            onClick={() => preview !== null && void copy(preview, 'diagnostics')}
            disabled={preview === null}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer hover:opacity-85 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <CopyStatusIcon status={statusOf('diagnostics')} />
            {statusOf('diagnostics') === 'failed' ? 'Copy failed' : statusOf('diagnostics') === 'copied' ? 'Copied' : 'Copy text'}
          </button>
          <button
            type="button"
            onClick={() => logInfo && void reveal(logInfo.file)}
            disabled={!logInfo}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer hover:opacity-85 disabled:opacity-50"
            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Open log folder
          </button>
        </div>
      </div>
    </div>
  );
};
