import React, { useState } from 'react';
import {
  Search,
  Bot,
  Sparkles,
  Brain,
  Code2,
  Cpu,
  Zap,
  Smile,
  Terminal,
  Laptop,
  Binary,
  Command,
  FileCode2,
  Flame,
  Palette,
  Image as ImageIcon,
  Layers,
  Boxes,
  PenTool,
  Network,
  HardDrive,
  Workflow,
  Monitor,
  ShieldCheck,
  Globe,
  Star,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowUpRight,
  Share2
} from 'lucide-react';
import { AITool } from '../types';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { copyText } from '../lib/files';

interface ToolCardProps {
  tool: AITool;
  onToggleFavorite: (id: string) => void;
  onDeleteCustom?: (id: string) => void;
  onLaunchQuickSearch?: (tool: AITool) => void;
  defaultLaunchSearch?: boolean;
  onOpenConfigExporter?: (providerId?: string) => void;
  onOpenRateLimitMatrix?: () => void;
}

export const getIconComponent = (logo: string) => {
  switch (logo) {
    case 'Search': return Search;
    case 'Bot': return Bot;
    case 'Sparkles': return Sparkles;
    case 'Brain': return Brain;
    case 'Code2': return Code2;
    case 'Cpu': return Cpu;
    case 'Zap': return Zap;
    case 'Smile': return Smile;
    case 'Terminal': return Terminal;
    case 'Laptop': return Laptop;
    case 'Binary': return Binary;
    case 'Command': return Command;
    case 'FileCode2': return FileCode2;
    case 'Flame': return Flame;
    case 'Palette': return Palette;
    case 'Image': return ImageIcon;
    case 'Layers': return Layers;
    case 'Boxes': return Boxes;
    case 'PenTool': return PenTool;
    case 'Network': return Network;
    case 'HardDrive': return HardDrive;
    case 'Workflow': return Workflow;
    case 'Monitor': return Monitor;
    case 'ShieldCheck': return ShieldCheck;
    default: return Globe;
  }
};

export const getScopeBadgeConfig = (scope: AITool['scope']) => {
  switch (scope) {
    case 'local-agent':
      return {
        label: 'Local Agent',
        description: 'Directly modifies local project files',
        canEditFiles: true,
      };
    case 'ide-plugin':
      return {
        label: 'IDE Integrated',
        description: 'VSCode / JetBrains local extension',
        canEditFiles: true,
      };
    case 'local-runner':
      return {
        label: 'Local Hardware',
        description: '100% offline, privacy, uses local GPU/CPU',
        canEditFiles: false,
      };
    case 'uniform-proxy':
      return {
        label: 'Uniform Router / Proxy',
        description: 'Unified multi-provider API router or free proxy',
        canEditFiles: false,
      };
    case 'cloud-builder':
      return {
        label: 'Cloud Builder',
        description: 'Creates & deploys full web apps online',
        canEditFiles: false,
      };
    case 'web-only':
    default:
      return {
        label: 'Web Only',
        description: 'Cloud generation only; cannot modify local files',
        canEditFiles: false,
      };
  }
};

/** Tools that can generate an IDE / agent config snippet. */
export const canExportConfig = (tool: AITool): boolean =>
  tool.freeTier.allowCustomApiKey ||
  tool.category === 'coding-agent' ||
  ['gemini', 'groq', 'openrouter', 'mistral', 'ollama', 'cline', 'continue', 'aider', 'cursor', 'windsurf'].includes(tool.id);

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  onToggleFavorite,
  onDeleteCustom,
  onLaunchQuickSearch,
  defaultLaunchSearch,
  onOpenConfigExporter,
  onOpenRateLimitMatrix,
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const IconComponent = getIconComponent(tool.logo);
  const scopeConfig = getScopeBadgeConfig(tool.scope);

  const copyShareLink = async () => {
    setCopyState((await copyText(tool.url)) ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 2000);
  };

  return (
    <div
      id={`card-tool-${tool.id}`}
      className="group relative flex flex-col justify-between rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text)',
      }}
    >
      {/* Top Card Header */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="p-2.5 rounded-xl border transition-colors shrink-0"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-semibold tracking-tight truncate" style={{ color: 'var(--theme-text)' }}>
                  {tool.name}
                </h3>
                {tool.badge && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded border font-medium"
                    style={{
                      backgroundColor: 'var(--theme-raised)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-secondary)',
                    }}
                  >
                    {tool.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  title={scopeConfig.description}
                  className="text-[10px] px-2 py-0.5 rounded-md border font-medium inline-flex items-center gap-1"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-primary)',
                  }}
                >
                  {scopeConfig.label}
                </span>
                {scopeConfig.canEditFiles ? (
                  <span
                    title="Can read, modify, and write files in your local codebase"
                    className="text-[10px] px-1.5 py-0.5 rounded border font-medium inline-flex items-center gap-0.5"
                    style={{
                      color: 'var(--theme-success)',
                      backgroundColor: 'var(--theme-raised)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" /> Edits Local Files
                  </span>
                ) : (
                  <span
                    title="Runs in cloud/browser; cannot touch local disk files"
                    className="text-[10px] px-1.5 py-0.5 rounded border font-medium inline-flex items-center gap-0.5"
                    style={{
                      backgroundColor: 'var(--theme-raised)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-muted)',
                    }}
                  >
                    <AlertCircle className="w-2.5 h-2.5 opacity-60" /> Web/Cloud Only
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              id={`btn-fav-${tool.id}`}
              onClick={() => onToggleFavorite(tool.id)}
              className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-85"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: tool.isFavorite ? '#f59e0b' : 'var(--theme-border)',
                color: tool.isFavorite ? '#f59e0b' : 'var(--theme-text-muted)',
              }}
              title={tool.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-3.5 h-3.5 ${tool.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {tool.isCustom && onDeleteCustom && (
              <ConfirmDeleteButton
                id={`btn-del-${tool.id}`}
                name={tool.name}
                onConfirm={() => onDeleteCustom(tool.id)}
                className="p-1.5 rounded-lg border transition-colors cursor-pointer text-rose-500 hover:opacity-85"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                }}
              />
            )}
          </div>
        </div>

        <p className="text-xs line-clamp-2 leading-relaxed mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
          {tool.description}
        </p>
      </div>

      {/* Free Tier Quota Panel */}
      <div
        className="px-4 sm:px-5 py-2.5 border-t border-b"
        style={{
          backgroundColor: 'var(--theme-raised)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1" style={{ color: 'var(--theme-primary)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
            Free Tier Allowance
          </span>
          <span className="text-[11px] font-medium text-right truncate" style={{ color: 'var(--theme-text-secondary)' }}>
            {tool.freeTier.freeCreditValue || 'Free plan'}
          </span>
        </div>
        <p className="text-xs leading-snug" style={{ color: 'var(--theme-text)' }}>
          {tool.freeTier.summary}
        </p>

        {/* Capabilities Pills */}
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t text-[10px]" style={{ borderColor: 'var(--theme-border)' }}>
          {tool.freeTier.hasWebSearch ? (
            <span
              className="px-1.5 py-0.5 rounded border font-medium"
              style={{
                color: 'var(--theme-info)',
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
              }}
            >
              🌐 Live Web Search
            </span>
          ) : (
            <span
              className="px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-muted)',
              }}
            >
              No live search
            </span>
          )}

          {!tool.freeTier.creditCardRequired && (
            <span
              className="px-1.5 py-0.5 rounded border font-medium"
              style={{
                color: 'var(--theme-success)',
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
              }}
            >
              No Credit Card
            </span>
          )}

          {tool.freeTier.allowCustomApiKey && (
            <span
              className="px-1.5 py-0.5 rounded border font-medium flex items-center gap-0.5"
              style={{
                backgroundColor: 'var(--theme-card)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
            >
              <KeyRound className="w-2.5 h-2.5" /> Free Key Supported
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div
        className="p-3 sm:px-5 flex items-center justify-between gap-2 rounded-b-xl"
        style={{ backgroundColor: 'var(--theme-card)' }}
      >
        <div className="flex items-center gap-1.5">
          {tool.quickSearchUrlTemplate && onLaunchQuickSearch && (
            <button
              id={`btn-quick-search-${tool.id}`}
              onClick={() => onLaunchQuickSearch(tool)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 cursor-pointer hover:opacity-85"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-primary)',
              }}
              title="Quickly search or prompt this AI"
            >
              <Search className="w-3 h-3" />
              Quick Query
            </button>
          )}

          {tool.downloadUrl && (
            <a
              id={`link-download-${tool.id}`}
              href={tool.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 hover:opacity-85"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              title="Download Desktop App / CLI"
            >
              <Download className="w-3 h-3 opacity-60" />
              Download
            </a>
          )}

          {canExportConfig(tool) && onOpenConfigExporter && (
            <button
              id={`btn-config-exporter-${tool.id}`}
              onClick={() => onOpenConfigExporter(tool.id)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 cursor-pointer hover:opacity-85"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
              }}
              title="Export IDE or Agent config (Cline, Continue, Cursor, Aider)"
            >
              <Code2 className="w-3 h-3 text-sky-500" />
              <span>Config</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copyShareLink}
            className="p-1.5 rounded-lg border transition-colors cursor-pointer hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: copyState === 'copied' ? '#10b981' : copyState === 'failed' ? '#ef4444' : 'var(--theme-text-muted)',
            }}
            title={copyState === 'failed' ? 'Copy failed' : copyState === 'copied' ? 'Link copied' : 'Copy website link'}
            aria-label="Copy website link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {defaultLaunchSearch && onLaunchQuickSearch && tool.quickSearchUrlTemplate ? (
            <button
              id={`link-open-${tool.id}`}
              onClick={() => onLaunchQuickSearch(tool)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap active:scale-95 hover:opacity-95"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              Launch <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <a
              id={`link-open-${tool.id}`}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap active:scale-95 hover:opacity-95"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-primary-foreground, #000000)',
              }}
            >
              Launch <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
