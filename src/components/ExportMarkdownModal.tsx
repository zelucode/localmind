import React, { useState, useMemo } from 'react';
import { X, FileText, Copy, Check, Download, Table, List } from 'lucide-react';
import { ToolBookmark } from '../types';
import { copyText, downloadTextFile } from '../lib/files';

interface ExportMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: ToolBookmark[];
  activeCategoryName: string;
}

export const ExportMarkdownModal: React.FC<ExportMarkdownModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  activeCategoryName,
}) => {
  const [format, setFormat] = useState<'table' | 'list'>('table');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  // Generate GitHub-flavored Markdown
  const markdownContent = useMemo(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const header = [
      `# Online Tools & Utilities (${bookmarks.length} tools)`,
      `> Exported from LocalMind on ${timestamp}`,
      `> Scope: ${activeCategoryName}`,
      '',
    ];
    const oneLine = (text: string) => (text || '').replace(/\s*\n\s*/g, ' ');
    const mdText = (text: string) => text.replace(/([\\[\]])/g, '\\$1');
    const mdUrl = (url: string) => url.replace(/\)/g, '%29');

    if (format === 'table') {
      const tableRows = [
        '| Tool | Category | Type | License | Stars | Description | Link |',
        '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
        ...bookmarks.map((b) => {
          const starsText = b.stars ? `${(b.stars / 1000).toFixed(1)}k` : '-';
          const licText = b.license || 'Free';
          const typeText = b.isAi ? '🤖 AI' : '🛠️ Utility';
          const cleanDesc = oneLine(b.description).replace(/\|/g, '\\|');
          const title = mdText(b.title).replace(/\|/g, '\\|');
          const titleMd = b.githubUrl ? `[**${title}**](${mdUrl(b.githubUrl)})` : `**${title}**`;
          return `| ${titleMd} | ${b.category} | ${typeText} | ${licText} | ${starsText} | ${cleanDesc} | [Open Tool](${mdUrl(b.url)}) |`;
        }),
      ];
      return [...header, ...tableRows, '', '---', '*Generated with LocalMind*'].join('\n');
    } else {
      const listItems = bookmarks.map((b) => {
        const lines = [
          `### [${mdText(b.title)}](${mdUrl(b.url)})`,
          `- **Description**: ${oneLine(b.description)}`,
          `- **Category**: ${b.category} | **Type**: ${b.isAi ? 'AI Web Utility' : 'Web Developer Tool'}`,
        ];
        if (b.license) lines.push(`- **License**: ${b.license}`);
        if (b.githubUrl) {
          const stars = b.stars ? ` (★ ${b.stars.toLocaleString()} stars)` : '';
          lines.push(`- **GitHub Repository**: [${b.githubUrl}](${b.githubUrl})${stars}`);
        }
        if (b.tags && b.tags.length > 0) {
          lines.push(`- **Tags**: ${b.tags.map((t) => `\`${t}\``).join(', ')}`);
        }
        return lines.join('\n');
      });

      return [...header, listItems.join('\n\n'), '', '---', '*Generated with LocalMind*'].join('\n');
    }
  }, [bookmarks, format, activeCategoryName]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    setCopyState((await copyText(markdownContent)) ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 2000);
  };

  const handleDownload = () => {
    const day = new Date().toISOString().split('T')[0];
    downloadTextFile(`localmind_tools_${format}_${day}.md`, markdownContent, 'text/markdown');
  };

  return (
    <div
      id="modal-export-markdown"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-4"
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                Export Bookmarks as Markdown
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Exporting {bookmarks.length} filtered online tools in GitHub-ready Markdown
              </p>
            </div>
          </div>

          <button
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

        {/* Toolbar Controls */}
        <div
          className="px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{
            backgroundColor: 'var(--theme-card)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-center gap-1.5 p-1 rounded-lg border" style={{ borderColor: 'var(--theme-border)' }}>
            <button
              onClick={() => setFormat('table')}
              className="px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              style={
                format === 'table'
                  ? {
                      backgroundColor: 'var(--theme-raised)',
                      color: 'var(--theme-primary)',
                      boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                    }
                  : { color: 'var(--theme-text-muted)' }
              }
            >
              <Table className="w-3.5 h-3.5" />
              <span>Markdown Table</span>
            </button>
            <button
              onClick={() => setFormat('list')}
              className="px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              style={
                format === 'list'
                  ? {
                      backgroundColor: 'var(--theme-raised)',
                      color: 'var(--theme-primary)',
                      boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                    }
                  : { color: 'var(--theme-text-muted)' }
              }
            >
              <List className="w-3.5 h-3.5" />
              <span>Detailed List</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-markdown"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
            >
              {copyState === 'copied' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copyState === 'copied' ? 'Copied Markdown!' : copyState === 'failed' ? 'Copy failed: use Download instead' : 'Copy Markdown'}</span>
            </button>

            <button
              id="btn-download-markdown"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-95 active:scale-95"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>

        {/* Code Preview Area */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col min-h-0">
          <div
            className="flex-1 rounded-xl border p-4 font-mono text-xs overflow-y-auto leading-relaxed whitespace-pre-wrap select-all select-text"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            {markdownContent}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t flex items-center justify-between text-xs"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-secondary)',
          }}
        >
          <span>Ready to paste directly into GitHub README.md, Gists, or documentation.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md border cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
