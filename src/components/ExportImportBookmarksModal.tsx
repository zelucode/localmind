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
import { ToolBookmark, BookmarkCategory } from '../types';

interface ExportImportBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: ToolBookmark[];
  onImportBookmarks: (newBookmarks: ToolBookmark[], mode: 'merge' | 'replace' | 'skip') => void;
  onResetToDefaults?: () => void;
}

type ExportFormat = 'json' | 'html' | 'markdown' | 'csv';
type ImportMode = 'merge' | 'replace' | 'skip';

export const ExportImportBookmarksModal: React.FC<ExportImportBookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onImportBookmarks,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  
  // Export State
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [exportFilter, setExportFilter] = useState<'all' | 'favorites'>('all');
  const [copied, setCopied] = useState(false);

  // Import State
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [parsedPreview, setParsedPreview] = useState<{
    valid: boolean;
    items: ToolBookmark[];
    error?: string;
    sourceType?: 'json' | 'html';
  } | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bookmarks to export
  const exportItems = useMemo(() => {
    if (exportFilter === 'favorites') {
      return bookmarks.filter((b) => b.isFavorite);
    }
    return bookmarks;
  }, [bookmarks, exportFilter]);

  // Generate Export String
  const exportContent = useMemo(() => {
    if (exportFormat === 'json') {
      const payload = {
        app: 'AI Nexus & Developer Tools Hub',
        version: 1,
        exportedAt: new Date().toISOString(),
        totalCount: exportItems.length,
        bookmarks: exportItems,
      };
      return JSON.stringify(payload, null, 2);
    }

    if (exportFormat === 'html') {
      // Netscape Bookmark Format compatible with Chrome, Firefox, Safari, Edge, Arc
      const now = Math.floor(Date.now() / 1000);
      let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks - AI Nexus</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">AI Nexus & Developer Tools</H3>
    <DL><p>
`;
      exportItems.forEach((b) => {
        const tags = (b.tags || []).join(',');
        html += `        <DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${now}" TAGS="${escapeHtml(tags)}">${escapeHtml(b.title)}</A>\n`;
        if (b.description) {
          html += `        <DD>${escapeHtml(b.description)}\n`;
        }
      });
      html += `    </DL><p>
</DL><p>`;
      return html;
    }

    if (exportFormat === 'markdown') {
      let md = `# AI Nexus Bookmarks (${exportItems.length} tools)\n\n`;
      md += `*Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n\n`;
      
      const byCategory: Record<string, ToolBookmark[]> = {};
      exportItems.forEach((b) => {
        const cat = b.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(b);
      });

      Object.entries(byCategory).forEach(([cat, list]) => {
        md += `## ${cat.toUpperCase()} (${list.length})\n\n`;
        list.forEach((b) => {
          md += `- [**${b.title}**](${b.url}) - ${b.description || 'No description'}\n`;
          if (b.tags && b.tags.length > 0) {
            md += `  *Tags: \`${b.tags.join('`, `')}\`*\n`;
          }
        });
        md += `\n`;
      });
      return md;
    }

    if (exportFormat === 'csv') {
      const headers = ['Title', 'URL', 'Category', 'Is AI', 'Badge', 'Tags', 'Description', 'GitHub URL', 'Stars'];
      const rows = exportItems.map((b) => [
        escapeCsv(b.title),
        escapeCsv(b.url),
        escapeCsv(b.category),
        b.isAi ? 'true' : 'false',
        escapeCsv(b.freeTierBadge || ''),
        escapeCsv((b.tags || []).join(', ')),
        escapeCsv(b.description || ''),
        escapeCsv(b.githubUrl || ''),
        b.stars ? String(b.stars) : '0',
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    return '';
  }, [exportItems, exportFormat]);

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download File
  const handleDownload = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let ext = 'json';
    let mime = 'application/json';

    if (exportFormat === 'html') {
      ext = 'html';
      mime = 'text/html';
    } else if (exportFormat === 'markdown') {
      ext = 'md';
      mime = 'text/markdown';
    } else if (exportFormat === 'csv') {
      ext = 'csv';
      mime = 'text/csv';
    }

    const filename = `ai_nexus_bookmarks_${exportFilter}_${dateStr}.${ext}`;
    const blob = new Blob([exportContent], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse Raw Text (JSON or HTML)
  const parseRawContent = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      setParsedPreview(null);
      return;
    }

    // Attempt 1: JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        let list: any[] = [];
        if (Array.isArray(parsed)) {
          list = parsed;
        } else if (parsed && Array.isArray(parsed.bookmarks)) {
          list = parsed.bookmarks;
        } else {
          setParsedPreview({
            valid: false,
            items: [],
            error: 'JSON must be an array of bookmarks or an object with a "bookmarks" array.',
          });
          return;
        }

        // Normalize bookmarks
        const normalized: ToolBookmark[] = list
          .filter((item) => item && (item.url || item.href) && (item.title || item.name))
          .map((item, idx) => ({
            id: item.id || `bm-import-${Date.now()}-${idx}`,
            title: item.title || item.name || 'Untitled Tool',
            url: item.url || item.href || '',
            description: item.description || item.desc || '',
            category: (item.category as BookmarkCategory) || 'utilities',
            isAi: typeof item.isAi === 'boolean' ? item.isAi : false,
            freeTierBadge: item.freeTierBadge || 'Free Web Tool',
            tags: Array.isArray(item.tags) ? item.tags : [],
            isFavorite: !!item.isFavorite,
            createdAt: item.createdAt || new Date().toISOString().split('T')[0],
            githubUrl: item.githubUrl || undefined,
            stars: typeof item.stars === 'number' ? item.stars : undefined,
          }));

        if (normalized.length === 0) {
          setParsedPreview({
            valid: false,
            items: [],
            error: 'No valid bookmarks found in JSON. Each bookmark needs at least a title and url.',
          });
          return;
        }

        setParsedPreview({
          valid: true,
          items: normalized,
          sourceType: 'json',
        });
        return;
      } catch (err: any) {
        // Fall through or set error
      }
    }

    // Attempt 2: HTML Netscape Bookmarks
    if (trimmed.includes('<A HREF=') || trimmed.includes('<a href=')) {
      try {
        const normalized: ToolBookmark[] = [];
        const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
        let match;
        let idx = 0;
        while ((match = regex.exec(trimmed)) !== null) {
          const url = match[1];
          const rawTitle = match[2].replace(/<[^>]*>/g, '').trim();
          if (url && rawTitle && !url.startsWith('javascript:')) {
            normalized.push({
              id: `bm-html-${Date.now()}-${idx++}`,
              title: rawTitle,
              url: url,
              description: 'Imported from browser bookmarks',
              category: 'utilities',
              isAi: false,
              freeTierBadge: 'Browser Bookmark',
              tags: ['imported'],
              createdAt: new Date().toISOString().split('T')[0],
            });
          }
        }

        if (normalized.length > 0) {
          setParsedPreview({
            valid: true,
            items: normalized,
            sourceType: 'html',
          });
          return;
        }
      } catch (err) {
        // Fall through
      }
    }

    setParsedPreview({
      valid: false,
      items: [],
      error: 'Unrecognized format. Please provide a valid JSON array or standard HTML bookmarks file.',
    });
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportText(text);
      parseRawContent(text);
    };
    reader.readAsText(file);
  };

  // Trigger Import
  const handleApplyImport = () => {
    if (!parsedPreview || !parsedPreview.valid || parsedPreview.items.length === 0) return;

    onImportBookmarks(parsedPreview.items, importMode);

    const count = parsedPreview.items.length;
    setImportSuccessMsg(`Successfully imported ${count} bookmarks (${importMode} mode)!`);
    setParsedPreview(null);
    setImportText('');

    setTimeout(() => {
      setImportSuccessMsg(null);
      onClose();
    }, 1500);
  };

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
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
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
                    Click to browse or drop file here
                  </span>
                  <span className="text-[11px] opacity-70">
                    Supports JSON backups (.json) or browser bookmarks (.html)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.html,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Raw Text Input */}
              <div>
                <label className="block font-semibold mb-1 opacity-90">
                  Or Paste JSON or HTML Bookmarks Text:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    parseRawContent(e.target.value);
                  }}
                  placeholder="Paste JSON array or browser bookmarks HTML here..."
                  className="w-full h-28 p-3 rounded-xl border font-mono text-[11px] focus:outline-hidden"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                />
              </div>

              {/* Parsing status & preview */}
              {parsedPreview && (
                <div
                  className="p-3.5 rounded-xl border space-y-2.5 animate-in fade-in"
                  style={
                    parsedPreview.valid
                      ? {
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          borderColor: 'rgba(16, 185, 129, 0.25)',
                        }
                      : {
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          borderColor: 'rgba(239, 68, 68, 0.25)',
                        }
                  }
                >
                  <div className="flex items-center gap-2">
                    {parsedPreview.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span className="font-semibold text-xs">
                      {parsedPreview.valid
                        ? `Detected ${parsedPreview.items.length} valid bookmarks (${parsedPreview.sourceType?.toUpperCase()} format)`
                        : 'Invalid bookmark payload'}
                    </span>
                  </div>

                  {parsedPreview.error && (
                    <p className="text-[11px] text-rose-400 pl-6">{parsedPreview.error}</p>
                  )}

                  {parsedPreview.valid && (
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center gap-3 text-[11px] opacity-80 flex-wrap">
                        <span>
                          AI Utilities: {parsedPreview.items.filter((b) => b.isAi).length}
                        </span>
                        <span>•</span>
                        <span>
                          Developer / Web Tools: {parsedPreview.items.filter((b) => !b.isAi).length}
                        </span>
                      </div>

                      {/* Sample preview pills */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {parsedPreview.items.slice(0, 6).map((item, idx) => (
                          <span
                            key={`preview-${idx}`}
                            className="px-2 py-0.5 rounded-md border text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--theme-card)',
                              borderColor: 'var(--theme-border)',
                            }}
                          >
                            {item.title}
                          </span>
                        ))}
                        {parsedPreview.items.length > 6 && (
                          <span className="text-[10px] opacity-60">
                            +{parsedPreview.items.length - 6} more
                          </span>
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
                      Combines new items & updates duplicates (recommended)
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
                      Ignores any bookmark with matching URL
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
                      Overwrites entire current bookmarks list
                    </span>
                  </button>
                </div>
              </div>

              {/* Apply Import Button */}
              <div className="flex items-center justify-between pt-2">
                {onResetToDefaults && (
                  <button
                    onClick={() => {
                      if (window.confirm('Reset bookmarks back to default 270+ tools?')) {
                        onResetToDefaults();
                        onClose();
                      }
                    }}
                    className="text-xs text-rose-400 hover:underline cursor-pointer opacity-80 hover:opacity-100 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset to 270+ Defaults</span>
                  </button>
                )}

                <button
                  id="btn-confirm-import"
                  onClick={handleApplyImport}
                  disabled={!parsedPreview || !parsedPreview.valid || parsedPreview.items.length === 0}
                  className="px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm cursor-pointer hover:opacity-90 transition-opacity ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary-foreground, #000000)',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    Import {parsedPreview?.valid ? `${parsedPreview.items.length} Bookmarks` : 'Bookmarks'}
                  </span>
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
            Bookmarks are saved in browser localStorage and will not be sent to any third-party server.
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper utilities for export escaping
function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCsv(field: string): string {
  if (!field) return '""';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
