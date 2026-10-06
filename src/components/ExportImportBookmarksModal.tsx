import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileCode,
  FileText,
  FileSpreadsheet,
  Check,
  Copy,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Layers,
  ArrowRight,
  FolderInput,
  Info
} from 'lucide-react';
import { ToolBookmark } from '../types';
import {
  FORMAT_INFO,
  ImportMode,
  ImportResult,
  ImportSource,
  ImportedBookmark,
  ParseResult,
  TransferFormat,
  exportBookmarks,
  exportFilename,
  parseImport,
  previewImport,
} from '../lib/bookmarkTransfer';
import { copyText, downloadTextFile } from '../lib/files';
import { DEFAULT_BOOKMARKS } from '../data/defaultBookmarks';

interface ExportImportBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: ToolBookmark[];
  onImportBookmarks: (items: ImportedBookmark[], mode: ImportMode, source: ImportSource) => ImportResult;
  onResetToDefaults?: () => void;
}

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export const ExportImportBookmarksModal: React.FC<ExportImportBookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onImportBookmarks,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  
  // Export State
  const [exportFormat, setExportFormat] = useState<TransferFormat>('json');
  const [exportFilter, setExportFilter] = useState<'all' | 'favorites'>('all');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  // Import State
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  // Destructive actions ask for a second click inside the modal instead of window.confirm.
  const [confirming, setConfirming] = useState<'replace' | 'reset' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bookmarks to export
  const exportItems = useMemo(() => {
    if (exportFilter === 'favorites') {
      return bookmarks.filter((b) => b.isFavorite);
    }
    return bookmarks;
  }, [bookmarks, exportFilter]);

  const exportContent = useMemo(() => exportBookmarks(exportItems, exportFormat), [exportItems, exportFormat]);

  const importItems = parsed && 'items' in parsed ? parsed.items : [];
  const importCounts = useMemo(() => previewImport(bookmarks, importItems), [bookmarks, importItems]);

  const handleCopy = async () => {
    setCopyState((await copyText(exportContent)) ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 2000);
  };

  const handleDownload = () => {
    downloadTextFile(exportFilename(exportFormat, exportFilter), exportContent, FORMAT_INFO[exportFormat].mime, exportFormat === 'csv');
  };

  const parseText = (text: string) => {
    setConfirming(null);
    setImportSuccessMsg(null);
    setParsed(text.trim() ? parseImport(text) : null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be chosen again
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setParsed({ ok: false, error: `${file.name} is too large (limit 5 MB).` });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? '');
      setImportText(text);
      parseText(text);
    };
    reader.onerror = () => setParsed({ ok: false, error: `Could not read ${file.name}.` });
    reader.readAsText(file);
  };

  const runImport = () => {
    if (!parsed || !('items' in parsed)) return;
    const result = onImportBookmarks(parsed.items, importMode, parsed.source);
    setImportSuccessMsg(
      importMode === 'replace'
        ? `Replaced your list with ${result.added} bookmarks.`
        : `Imported: ${result.added} added${result.updated ? `, ${result.updated} updated` : ''}${result.skipped ? `, ${result.skipped} skipped` : ''}.`,
    );
    setParsed(null);
    setImportText('');
    setConfirming(null);
    setTimeout(() => {
      setImportSuccessMsg(null);
      onClose();
    }, 1500);
  };

  const handleApplyImport = () => {
    if (importMode === 'replace' && confirming !== 'replace') {
      setConfirming('replace');
      return;
    }
    runImport();
  };

  const canImport = importItems.length > 0;

  if (!isOpen) return null;

  return (
    <div
      id="export-import-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="export-import-modal-container"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-4"
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
            >
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Export & Import Bookmarks
              </h2>
              <p className="text-xs opacity-70">
                Backup, migrate, or synchronize your online developer tools catalog
              </p>
            </div>
          </div>

          <button
            id="btn-close-export-import"
            onClick={onClose}
            className="p-1.5 rounded-lg border opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="px-6 pt-3 border-b flex items-center gap-2"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <button
            id="tab-export-bookmarks"
            onClick={() => {
              setActiveTab('export');
              setImportSuccessMsg(null);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-t-xl border-t border-x -mb-px flex items-center gap-2 transition-all cursor-pointer"
            style={
              activeTab === 'export'
                ? {
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                  }
                : {
                    borderColor: 'transparent',
                    opacity: 0.65,
                    color: 'var(--theme-text)',
                  }
            }
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Bookmarks</span>
            <span
              className="px-1.5 py-0.2 rounded-full text-[10px] font-mono border"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
              }}
            >
              {bookmarks.length}
            </span>
          </button>

          <button
            id="tab-import-bookmarks"
            onClick={() => {
              setActiveTab('import');
              setImportSuccessMsg(null);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-t-xl border-t border-x -mb-px flex items-center gap-2 transition-all cursor-pointer"
            style={
              activeTab === 'import'
                ? {
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                  }
                : {
                    borderColor: 'transparent',
                    opacity: 0.65,
                    color: 'var(--theme-text)',
                  }
            }
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Bookmarks</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {importSuccessMsg && (
            <div
              className="p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium animate-in fade-in"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#10b981',
              }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          {/* EXPORT TAB */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Format selection */}
              <div>
                <label className="block font-semibold mb-2 opacity-90">
                  Select Export Format:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    id="export-format-json"
                    onClick={() => setExportFormat('json')}
                    className="p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer"
                    style={
                      exportFormat === 'json'
                        ? {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary)',
                          }
                        : {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            color: 'var(--theme-text)',
                            opacity: 0.7,
                          }
                    }
                  >
                    <FileJson className="w-4 h-4" />
                    <span className="font-semibold text-xs">JSON Backup</span>
                    <span className="text-[10px] opacity-70">Complete Schema</span>
                  </button>

                  <button
                    id="export-format-html"
                    onClick={() => setExportFormat('html')}
                    className="p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer"
                    style={
                      exportFormat === 'html'
                        ? {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary)',
                          }
                        : {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            color: 'var(--theme-text)',
                            opacity: 0.7,
                          }
                    }
                  >
                    <FileCode className="w-4 h-4" />
                    <span className="font-semibold text-xs">HTML Netscape</span>
                    <span className="text-[10px] opacity-70">Browser Importable</span>
                  </button>

                  <button
                    id="export-format-markdown"
                    onClick={() => setExportFormat('markdown')}
                    className="p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer"
                    style={
                      exportFormat === 'markdown'
                        ? {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary)',
                          }
                        : {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            color: 'var(--theme-text)',
                            opacity: 0.7,
                          }
                    }
                  >
                    <FileText className="w-4 h-4" />
                    <span className="font-semibold text-xs">Markdown</span>
                    <span className="text-[10px] opacity-70">Documentation</span>
                  </button>

                  <button
                    id="export-format-csv"
                    onClick={() => setExportFormat('csv')}
                    className="p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer"
                    style={
                      exportFormat === 'csv'
                        ? {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary)',
                          }
                        : {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            color: 'var(--theme-text)',
                            opacity: 0.7,
                          }
                    }
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="font-semibold text-xs">CSV Spreadsheet</span>
                    <span className="text-[10px] opacity-70">Excel / Sheets</span>
                  </button>
                </div>
              </div>

              {/* Scope filter */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl border" style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}>
                <div>
                  <span className="font-semibold block">Export Scope:</span>
                  <span className="text-[11px] opacity-70">Choose which items to include in export file</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExportFilter('all')}
                    className="px-2.5 py-1 rounded-lg border font-medium cursor-pointer"
                    style={
                      exportFilter === 'all'
                        ? {
                            backgroundColor: 'var(--theme-primary)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary-foreground, #000000)',
                          }
                        : {
                            backgroundColor: 'var(--theme-card)',
                            borderColor: 'var(--theme-border)',
                          }
                    }
                  >
                    All ({bookmarks.length})
                  </button>
                  <button
                    onClick={() => setExportFilter('favorites')}
                    className="px-2.5 py-1 rounded-lg border font-medium cursor-pointer"
                    style={
                      exportFilter === 'favorites'
                        ? {
                            backgroundColor: 'var(--theme-primary)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary-foreground, #000000)',
                          }
                        : {
                            backgroundColor: 'var(--theme-card)',
                            borderColor: 'var(--theme-border)',
                          }
                    }
                  >
                    Favorites Only ({bookmarks.filter((b) => b.isFavorite).length})
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold opacity-90">Export Preview:</span>
                  <span className="text-[11px] font-mono opacity-60">
                    {exportItems.length} items • ~{(new Blob([exportContent]).size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div
                  className="relative rounded-xl border p-3 font-mono text-[11px] overflow-hidden max-h-44 overflow-y-auto"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <pre className="whitespace-pre-wrap break-all opacity-80">{exportContent.slice(0, 800)}{exportContent.length > 800 ? '\n... (truncated)' : ''}</pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  id="btn-copy-export"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl border flex items-center gap-1.5 font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  {copyState === 'copied' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copyState === 'copied' ? 'Copied to Clipboard!' : copyState === 'failed' ? 'Copy failed: use Download instead' : 'Copy to Clipboard'}</span>
                </button>

                <button
                  id="btn-download-export"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer hover:opacity-90 transition-opacity ml-auto"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary-foreground, #000000)',
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          )}

          {/* IMPORT TAB */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* Dropzone / File trigger */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity text-center"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div
                  className="p-2.5 rounded-full border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold block text-xs">
                    Click to choose a file
                  </span>
                  <span className="text-[11px] opacity-70">
                    LocalMind JSON backup, browser bookmarks (.html) or CSV
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.html,.htm,.csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Raw Text Input */}
              <div>
                <label className="block font-semibold mb-1 opacity-90">
                  Or paste JSON, HTML or CSV text:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    parseText(e.target.value);
                  }}
                  placeholder="Paste a JSON backup, browser bookmarks HTML or CSV here..."
                  className="w-full h-28 p-3 rounded-xl border font-mono text-[11px] focus:outline-hidden"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>

              {/* Parsing status & preview */}
              {parsed && (
                <div
                  className="p-3.5 rounded-xl border space-y-2.5 animate-in fade-in"
                  style={
                    canImport
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }
                      : { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }
                  }
                >
                  <div className="flex items-center gap-2">
                    {canImport ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-semibold text-xs">
                      {canImport && 'source' in parsed
                        ? `Found ${importItems.length} bookmarks (${parsed.source.toUpperCase()} format)`
                        : 'Cannot import this'}
                    </span>
                  </div>

                  {'error' in parsed && <p className="text-[11px] text-rose-400 pl-6">{parsed.error}</p>}

                  {canImport && 'rejected' in parsed && (
                    <div className="space-y-2 pl-6">
                      <p className="text-[11px] opacity-90">
                        {importCounts.fresh} new • {importCounts.duplicates} already in your list
                        {parsed.rejected > 0 && ` • ${parsed.rejected} left out (no title, or not an http/https link)`}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] opacity-80 flex-wrap">
                        <span>AI Utilities: {importItems.filter((b) => b.isAi === true).length}</span>
                        <span>•</span>
                        <span>Other tools: {importItems.filter((b) => b.isAi !== true).length}</span>
                      </div>

                      {/* Sample preview pills */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {importItems.slice(0, 6).map((item, idx) => (
                          <span
                            key={`preview-${idx}`}
                            className="px-2 py-0.5 rounded-md border text-[10px] font-medium"
                            style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}
                          >
                            {item.title}
                          </span>
                        ))}
                        {importItems.length > 6 && (
                          <span className="text-[10px] opacity-60">+{importItems.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Import Mode options */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-semibold opacity-90">
                  Import Strategy:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setImportMode('merge')}
                    className="p-2.5 rounded-xl border text-left cursor-pointer transition-all"
                    style={
                      importMode === 'merge'
                        ? {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary)',
                          }
                        : {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            opacity: 0.7,
                          }
                    }
                  >
                    <span className="font-semibold block text-xs">Merge & Update</span>
                    <span className="text-[10px] opacity-70 block mt-0.5">
                      Adds new links and fills in details for ones you have (recommended)
                    </span>
                  </button>

                  <button
                    onClick={() => setImportMode('skip')}
                    className="p-2.5 rounded-xl border text-left cursor-pointer transition-all"
                    style={
                      importMode === 'skip'
                        ? {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary)',
                          }
                        : {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            opacity: 0.7,
                          }
                    }
                  >
                    <span className="font-semibold block text-xs">Add Only New</span>
                    <span className="text-[10px] opacity-70 block mt-0.5">
                      Leaves bookmarks you already have untouched
                    </span>
                  </button>

                  <button
                    onClick={() => setImportMode('replace')}
                    className="p-2.5 rounded-xl border text-left cursor-pointer transition-all"
                    style={
                      importMode === 'replace'
                        ? {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-primary)',
                            color: 'var(--theme-primary)',
                          }
                        : {
                            backgroundColor: 'var(--theme-raised)',
                            borderColor: 'var(--theme-border)',
                            opacity: 0.7,
                          }
                    }
                  >
                    <span className="font-semibold block text-xs text-rose-400">Replace All</span>
                    <span className="text-[10px] opacity-70 block mt-0.5">
                      Deletes your current list first
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirmation for destructive actions */}
              {confirming && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl border space-y-2.5"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <p className="text-xs font-medium">
                    {confirming === 'replace'
                      ? `This deletes all ${bookmarks.length} current bookmarks (custom ones and favorites included) and uses the ${importItems.length} from the file instead. Export a backup first if you are not sure.`
                      : `Replace your list with the ${DEFAULT_BOOKMARKS.length} default bookmarks? Custom bookmarks and favorites will be lost. Export a backup first if you are not sure.`}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-confirm-destructive"
                      onClick={() => {
                        if (confirming === 'replace') {
                          runImport();
                        } else {
                          onResetToDefaults?.();
                          setConfirming(null);
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                      style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                    >
                      {confirming === 'replace' ? 'Yes, replace everything' : 'Yes, reset to defaults'}
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer"
                      style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Apply Import Button */}
              <div className="flex items-center justify-between pt-2">
                {onResetToDefaults && (
                  <button
                    onClick={() => setConfirming('reset')}
                    className="text-xs text-rose-400 hover:underline cursor-pointer opacity-80 hover:opacity-100 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset to {DEFAULT_BOOKMARKS.length} Defaults</span>
                  </button>
                )}

                <button
                  id="btn-confirm-import"
                  onClick={handleApplyImport}
                  disabled={!canImport || confirming !== null}
                  className="px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer hover:opacity-90 transition-opacity ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary-foreground, #000000)',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span>Import {canImport ? `${importItems.length} Bookmarks` : 'Bookmarks'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div
          className="px-6 py-3 border-t text-[11px] flex items-center gap-2 opacity-70"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            Bookmarks are stored on this device and are never sent to a server. Importing from a file or pasted text happens locally.
          </span>
        </div>
      </div>
    </div>
  );
};
