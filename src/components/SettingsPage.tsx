import React, { useEffect, useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Check,
  RotateCcw,
  Download,
  Upload,
  Sliders,
  Database,
  Code,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  FolderInput,
  Compass,
  Play,
} from 'lucide-react';
import {
  ThemePreset,
  defaultThemePresets,
  resolveThemeTokens,
  validateThemePresets,
} from '../theme';

interface SettingsPageProps {
  currentThemeId: string;
  customAccentColor?: string;
  onSelectTheme: (presetId: string) => void;
  onSetCustomAccentColor: (colorHex?: string) => void;
  onSaveCustomPresets: (presets: ThemePreset[]) => void;
  allPresets: ThemePreset[];
  showScopeExplainer: boolean;
  onToggleShowScopeExplainer: (show: boolean) => void;
  defaultLaunchSearch: boolean;
  onToggleDefaultLaunchSearch: (enabled: boolean) => void;
  showOnStartup?: boolean;
  onToggleShowOnStartup?: (show: boolean) => void;
  onOpenStartupScreen?: () => void;
  showLoadingAnimation?: boolean;
  onToggleShowLoadingAnimation?: (show: boolean) => void;
  onReplayLoadingAnimation?: () => void;
  onOpenExportImportBookmarks?: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonContent: string) => void;
  onResetFactoryDefaults: () => void;
  onBackToDashboard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentThemeId,
  customAccentColor,
  onSelectTheme,
  onSetCustomAccentColor,
  onSaveCustomPresets,
  allPresets,
  showScopeExplainer,
  onToggleShowScopeExplainer,
  defaultLaunchSearch,
  onToggleDefaultLaunchSearch,
  showOnStartup = true,
  onToggleShowOnStartup,
  onOpenStartupScreen,
  showLoadingAnimation = true,
  onToggleShowLoadingAnimation,
  onReplayLoadingAnimation,
  onOpenExportImportBookmarks,
  onExportBackup,
  onImportBackup,
  onResetFactoryDefaults,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'preferences' | 'data' | 'custom-json'>('themes');
  const [themeModeFilter, setThemeModeFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [jsonThemeText, setJsonThemeText] = useState(() => JSON.stringify(allPresets, null, 2));
  const [jsonStatus, setJsonStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [jsonDirty, setJsonDirty] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const activePreset = allPresets.find((p) => p.id === currentThemeId) || defaultThemePresets[0];

  const popularAccentSwatches = [
    { hex: '#f7591f', label: 'Pastel Vermillion' },
    { hex: '#e0a8c5', label: 'Pastel Rose' },
    { hex: '#1d4ed8', label: 'Blueprint Navy' },
    { hex: '#14b8a6', label: 'Cyber Teal' },
    { hex: '#10b981', label: 'Emerald Mint' },
    { hex: '#8b5cf6', label: 'Violet Spark' },
    { hex: '#f59e0b', label: 'Amber Gold' },
    { hex: '#06b6d4', label: 'Electric Cyan' },
  ];

  const filteredPresets = allPresets.filter((p) => {
    if (themeModeFilter === 'all') return true;
    return p.mode === themeModeFilter;
  });

  // Keep the editor in step with the saved presets (e.g. after a reset) unless the user is mid-edit.
  useEffect(() => {
    if (!jsonDirty) setJsonThemeText(JSON.stringify(allPresets, null, 2));
  }, [allPresets, jsonDirty]);

  const handleSaveJsonThemes = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonThemeText);
    } catch (err) {
      setJsonStatus({ ok: false, text: `Invalid JSON: ${err instanceof Error ? err.message : 'check the syntax'}` });
      return;
    }
    const checked = validateThemePresets(parsed);
    if ('error' in checked) {
      setJsonStatus({ ok: false, text: checked.error });
      return;
    }
    onSaveCustomPresets(checked.presets);
    setJsonDirty(false);
    setJsonStatus({ ok: true, text: 'Saved. Custom presets applied.' });
    setTimeout(() => setJsonStatus(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
        setImportStatus('Backup restored successfully!');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 transition-colors">
      {/* Top Banner */}
      <div
        className="p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        style={{
          backgroundColor: 'var(--theme-card)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-xl"
              style={{
                backgroundColor: 'var(--theme-raised)',
                color: 'var(--theme-primary)',
              }}
            >
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--theme-text)' }}>
              Workspace Settings & Themes
            </h2>
          </div>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
            Customize your visual styling, inspect theme presets, manage backups, and set launcher behavior.
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto cursor-pointer active:scale-95"
          style={{
            backgroundColor: 'var(--theme-primary)',
            color: 'var(--theme-primary-foreground, #000000)',
          }}
        >
          Return to Dashboard
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b overflow-x-auto pb-2" style={{ borderColor: 'var(--theme-border)' }}>
        <button
          onClick={() => setActiveTab('themes')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap"
          style={
            activeTab === 'themes'
              ? {
                  backgroundColor: 'var(--theme-raised)',
                  color: 'var(--theme-primary)',
                  boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                }
              : {
                  color: 'var(--theme-text-secondary)',
                }
          }
        >
          <Palette className="w-4 h-4" />
          <span>Themes & Color Schemes</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap"
          style={
            activeTab === 'preferences'
              ? {
                  backgroundColor: 'var(--theme-raised)',
                  color: 'var(--theme-primary)',
                  boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                }
              : {
                  color: 'var(--theme-text-secondary)',
                }
          }
        >
          <Sliders className="w-4 h-4" />
          <span>Hub Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap"
          style={
            activeTab === 'data'
              ? {
                  backgroundColor: 'var(--theme-raised)',
                  color: 'var(--theme-primary)',
                  boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                }
              : {
                  color: 'var(--theme-text-secondary)',
                }
          }
        >
          <Database className="w-4 h-4" />
          <span>Data & Backups</span>
        </button>

        <button
          onClick={() => setActiveTab('custom-json')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap"
          style={
            activeTab === 'custom-json'
              ? {
                  backgroundColor: 'var(--theme-raised)',
                  color: 'var(--theme-primary)',
                  boxShadow: 'inset 0 0 0 1px var(--theme-border)',
                }
              : {
                  color: 'var(--theme-text-secondary)',
                }
          }
        >
          <Code className="w-4 h-4" />
          <span>Custom Themes JSON</span>
        </button>
      </div>

      {/* TAB 1: THEMES & COLOR SCHEMES */}
      {activeTab === 'themes' && (
        <div className="space-y-6">
          {/* Active Theme Summary & Live Preview */}
          <div
            className="p-5 rounded-2xl border transition-all"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--theme-text-muted)' }}>
                  Currently Active Theme
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                    {activePreset.name}
                  </h2>
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-md font-semibold uppercase border"
                    style={{
                      backgroundColor: 'var(--theme-raised)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-primary)',
                    }}
                  >
                    {activePreset.mode} mode
                  </span>
                  {customAccentColor && (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md font-medium border"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-primary)',
                        color: 'var(--theme-primary)',
                      }}
                    >
                      Custom Accent Active
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 max-w-xl" style={{ color: 'var(--theme-text-secondary)' }}>
                  {activePreset.description}
                </p>
              </div>

              {/* Quick Live Preview Components */}
              <div
                className="p-3.5 rounded-xl border flex flex-wrap items-center gap-2.5 max-w-md"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <button
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary-foreground, #000000)',
                  }}
                >
                  Primary Action
                </button>
                <span
                  className="px-2.5 py-1 text-xs rounded-md font-medium border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  Surface Raised
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  Accent Ink
                </span>
              </div>
            </div>

            {/* Custom Accent Color Override */}
            <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                  Custom Accent Hue:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {popularAccentSwatches.map((swatch) => (
                    <button
                      key={swatch.hex}
                      onClick={() => onSetCustomAccentColor(swatch.hex)}
                      title={swatch.label}
                      className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 transition-transform hover:scale-110 active:scale-95 cursor-pointer relative"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {customAccentColor?.toLowerCase() === swatch.hex.toLowerCase() && (
                        <Check className="w-3 h-3 text-white absolute inset-0 m-auto drop-shadow" />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={customAccentColor || activePreset.primaryColor}
                    onChange={(e) => onSetCustomAccentColor(e.target.value)}
                    title="Custom Hex Picker"
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer ml-1"
                  />
                </div>
              </div>

              {customAccentColor && (
                <button
                  onClick={() => onSetCustomAccentColor(undefined)}
                  className="text-xs flex items-center gap-1 cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text)' }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset to preset accent
                </button>
              )}
            </div>
          </div>

          {/* Mode Selector & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--theme-text-secondary)' }}>
                Theme Filter:
              </span>
              <div
                className="inline-flex rounded-lg p-1 border"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <button
                  onClick={() => setThemeModeFilter('all')}
                  className="px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer"
                  style={
                    themeModeFilter === 'all'
                      ? {
                          backgroundColor: 'var(--theme-primary)',
                          color: 'var(--theme-primary-foreground, #000000)',
                        }
                      : {
                          color: 'var(--theme-text-secondary)',
                        }
                  }
                >
                  All ({allPresets.length})
                </button>
                <button
                  onClick={() => setThemeModeFilter('dark')}
                  className="px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  style={
                    themeModeFilter === 'dark'
                      ? {
                          backgroundColor: 'var(--theme-primary)',
                          color: 'var(--theme-primary-foreground, #000000)',
                        }
                      : {
                          color: 'var(--theme-text-secondary)',
                        }
                  }
                >
                  <Moon className="w-3 h-3" />
                  Dark
                </button>
                <button
                  onClick={() => setThemeModeFilter('light')}
                  className="px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1"
                  style={
                    themeModeFilter === 'light'
                      ? {
                          backgroundColor: 'var(--theme-primary)',
                          color: 'var(--theme-primary-foreground, #000000)',
                        }
                      : {
                          color: 'var(--theme-text-secondary)',
                        }
                  }
                >
                  <Sun className="w-3 h-3" />
                  Light
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
              <span>Selected Theme: <strong style={{ color: 'var(--theme-text)' }}>{activePreset.name}</strong></span>
            </div>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => {
              const isSelected = currentThemeId === preset.id;
              const isPastelDusk = preset.id === 'pastel-dusk';
              const isSoftPaper = preset.id === 'soft-paper';
              const isBlueprint = preset.id === 'blueprint-light';

              return (
                <div
                  key={preset.id}
                  onClick={() => onSelectTheme(preset.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected ? 'ring-2 shadow-lg' : 'hover:scale-[1.01]'
                  }`}
                  style={{
                    backgroundColor: preset.cardBg,
                    borderColor: isSelected ? preset.primaryColor : preset.borderColor,
                    color: preset.textColor,
                    boxShadow: isSelected
                      ? `0 0 0 2px ${preset.primaryColor}50, 0 10px 15px -3px rgba(0, 0, 0, 0.15)`
                      : undefined,
                  }}
                >
                  <div>
                    {/* Header with Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tracking-tight">
                          {preset.name}
                        </span>
                        {preset.mode === 'dark' ? (
                          <Moon className="w-3 h-3 opacity-60" />
                        ) : (
                          <Sun className="w-3 h-3 text-amber-500" />
                        )}
                      </div>

                      {/* Featured Tags */}
                      <div className="flex items-center gap-1">
                        {isPastelDusk && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border" style={{ backgroundColor: '#e0a8c520', color: '#e0a8c5', borderColor: '#e0a8c540' }}>
                            Pastel Dusk
                          </span>
                        )}
                        {isSoftPaper && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border" style={{ backgroundColor: '#f7591f20', color: '#f7591f', borderColor: '#f7591f40' }}>
                            Soft Paper
                          </span>
                        )}
                        {isBlueprint && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border" style={{ backgroundColor: '#1d4ed820', color: '#1d4ed8', borderColor: '#1d4ed840' }}>
                            Blueprint
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs opacity-75 line-clamp-2 leading-relaxed mb-3">
                      {preset.description}
                    </p>
                  </div>

                  {/* Color Palette Swatches Preview */}
                  <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: preset.borderColor }}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border shadow-sm"
                        style={{ backgroundColor: preset.bgCanvas, borderColor: preset.borderColor }}
                        title={`Canvas BG: ${preset.bgCanvas}`}
                      />
                      <div
                        className="w-4 h-4 rounded-full border shadow-sm"
                        style={{ backgroundColor: preset.cardBg, borderColor: preset.borderColor }}
                        title={`Card BG: ${preset.cardBg}`}
                      />
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: preset.primaryColor }}
                        title={`Primary Accent: ${preset.primaryColor}`}
                      />
                      <div
                        className="w-4 h-4 rounded-full border shadow-sm"
                        style={{ backgroundColor: preset.textColor, borderColor: preset.borderColor }}
                        title={`Text Ink: ${preset.textColor}`}
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold">
                      {isSelected ? (
                        <span className="flex items-center gap-1" style={{ color: preset.primaryColor }}>
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="opacity-60 group-hover:opacity-100 flex items-center gap-0.5 text-[11px]">
                          Apply <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Design Philosophy Note */}
          <div
            className="p-4 rounded-xl border text-xs flex items-start gap-3"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-secondary)',
            }}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--theme-primary)' }} />
            <div>
              <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                Theme Architecture:
              </span>
              <p className="mt-0.5 leading-relaxed">
                Selecting <strong>Soft Paper</strong> gives you a clean warm paper canvas with soft vermillion pastel accents. <strong>Blueprint</strong> provides high-contrast technical drafting ink on white. <strong>Pastel Dusk</strong> softens dark mode with low-saturation rose twilight tones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HUB PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div
            className="p-5 rounded-2xl border space-y-5"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
              <Sliders className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
              General Workspace Preferences
            </h2>

            {/* Launch Behavior */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <div>
                <span className="text-xs sm:text-sm font-semibold block" style={{ color: 'var(--theme-text)' }}>
                  Quick Search Prompt on Tool Launch
                </span>
                <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  When clicking a tool card, open the prompt input modal so you can pre-fill your question or search query.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={defaultLaunchSearch}
                  onChange={(e) => onToggleDefaultLaunchSearch(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    backgroundColor: defaultLaunchSearch ? 'var(--theme-primary)' : 'var(--theme-border)',
                  }}
                ></div>
              </label>
            </div>

            {/* Show Scope Explainer Banner */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <div>
                <span className="text-xs sm:text-sm font-semibold block" style={{ color: 'var(--theme-text)' }}>
                  Show "Web vs Local Files" Scope Banner
                </span>
                <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  Displays the architecture banner clarifying that Web LLMs cannot touch your local project files while CLI/IDE agents can.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showScopeExplainer}
                  onChange={(e) => onToggleShowScopeExplainer(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    backgroundColor: showScopeExplainer ? 'var(--theme-primary)' : 'var(--theme-border)',
                  }}
                ></div>
              </label>
            </div>

            {/* Startup Welcome Screen on Launch */}
            <div className="flex items-start justify-between gap-4 pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold block" style={{ color: 'var(--theme-text)' }}>
                    Show Welcome & Startup Launcher on Open
                  </span>
                  {onOpenStartupScreen && (
                    <button
                      id="btn-preview-startup-screen"
                      onClick={onOpenStartupScreen}
                      className="px-2 py-0.5 rounded-md border text-[10px] font-medium flex items-center gap-1 cursor-pointer hover:opacity-85"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-primary)',
                      }}
                    >
                      <Compass className="w-3 h-3" />
                      <span>Preview Screen</span>
                    </button>
                  )}
                </div>
                <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  Presents the welcome bento cards, model quotas, and quick start shortcuts every time the application launches.
                </span>
              </div>
              {onToggleShowOnStartup && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="toggle-show-on-startup"
                    checked={showOnStartup}
                    onChange={(e) => onToggleShowOnStartup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                    style={{
                      backgroundColor: showOnStartup ? 'var(--theme-primary)' : 'var(--theme-border)',
                    }}
                  ></div>
                </label>
              )}
            </div>

            {/* Startup Loading Screen Animation */}
            <div className="flex items-start justify-between gap-4 pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold block" style={{ color: 'var(--theme-text)' }}>
                    Show Animated Boot Screen on Launch
                  </span>
                  {onReplayLoadingAnimation && (
                    <button
                      id="btn-replay-loading-animation"
                      onClick={onReplayLoadingAnimation}
                      className="px-2 py-0.5 rounded-md border text-[10px] font-medium flex items-center gap-1 cursor-pointer hover:opacity-85"
                      style={{
                        backgroundColor: 'var(--theme-raised)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-primary)',
                      }}
                    >
                      <Play className="w-3 h-3" />
                      <span>Replay Animation</span>
                    </button>
                  )}
                </div>
                <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  Presents the animated orbital LocalMind core, subsystem telemetry tracker, and progress bar while loading resources.
                </span>
              </div>
              {onToggleShowLoadingAnimation && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="toggle-show-loading-animation"
                    checked={showLoadingAnimation}
                    onChange={(e) => onToggleShowLoadingAnimation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                    style={{
                      backgroundColor: showLoadingAnimation ? 'var(--theme-primary)' : 'var(--theme-border)',
                    }}
                  ></div>
                </label>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATA & BACKUPS */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div
            className="p-5 rounded-2xl border space-y-5"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                <Database className="w-4 h-4 text-emerald-500" />
                Data Portability & Vault Backups
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                Your custom AI platforms, tracked API keys, and theme settings are safely stored in your browser's local sandbox.
              </p>
            </div>

            {/* Export / Import buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--theme-text)' }}>
                    Export Full Workspace Backup
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                  Downloads a comprehensive JSON file with all custom tool links, stored API keys, and theme choices.
                </p>
                <button
                  id="btn-export-backup"
                  onClick={onExportBackup}
                  className="px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary-foreground, #000000)',
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Backup JSON
                </button>
              </div>

              <div
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold" style={{ color: 'var(--theme-text)' }}>
                    Import / Restore Backup
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                  Select a previous backup JSON file to restore custom bookmarks, keys, and configured themes.
                </p>
                <label
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)',
                  }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Backup File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
                {importStatus && (
                  <p className="text-xs text-emerald-500 font-medium">
                    {importStatus}
                  </p>
                )}
              </div>

              {/* Dedicated Bookmarks Export / Import Center */}
              {onOpenExportImportBookmarks && (
                <div
                  className="p-4 rounded-xl border space-y-3 sm:col-span-2"
                  style={{
                    backgroundColor: 'var(--theme-raised)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FolderInput className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold" style={{ color: 'var(--theme-text)' }}>
                        270+ Developer Bookmarks Export & Import Center
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-semibold">
                      JSON • HTML Netscape • Markdown • CSV
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                    Export your curated collection of 270+ online developer tools or import browser bookmarks with smart merging and duplicate resolution.
                  </p>
                  <button
                    id="btn-settings-open-bookmarks-manager"
                    onClick={onOpenExportImportBookmarks}
                    className="px-4 py-2 text-xs font-bold rounded-lg border flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: 'var(--theme-card)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-primary)',
                    }}
                  >
                    <FolderInput className="w-3.5 h-3.5" />
                    <span>Open Bookmarks Exporter / Importer</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              )}
            </div>

            {/* Factory Reset */}
            <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--theme-border)' }}>
              <div>
                <span className="text-xs font-semibold text-rose-500 block">
                  Reset Factory Defaults
                </span>
                <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  Reverts the catalog to standard curated tools and resets custom themes to defaults.
                </span>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset all custom tools and theme settings to factory default?')) {
                    onResetFactoryDefaults();
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-medium rounded-lg border border-rose-500/30 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Reset Catalog & Themes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOM THEMES JSON */}
      {activeTab === 'custom-json' && (
        <div className="space-y-6">
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div>
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
                <Code className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                Custom ThemePreset JSON Schema
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                You can import or customize themes directly by providing a valid array of <code className="font-mono px-1 rounded border" style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}>ThemePreset</code> objects.
              </p>
            </div>

            <textarea
              value={jsonThemeText}
              onChange={(e) => {
                setJsonThemeText(e.target.value);
                setJsonDirty(true);
                setJsonStatus(null);
              }}
              rows={12}
              placeholder='[ { "id": "my-custom-theme", "name": "Neon Sunset", "mode": "dark", "primaryColor": "#ff6b6b", ... } ]'
              className="w-full font-mono text-xs p-3.5 rounded-xl focus:outline-none"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: 'var(--theme-border)',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: 'var(--theme-text)',
              }}
            />

            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={() => {
                  setJsonThemeText(JSON.stringify(defaultThemePresets, null, 2));
                  setJsonDirty(true);
                  setJsonStatus(null);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border cursor-pointer hover:opacity-85"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-secondary)',
                }}
              >
                Load Default Presets Schema
              </button>

              <div className="flex items-center gap-3">
                {jsonStatus && (
                  <span
                    role={jsonStatus.ok ? 'status' : 'alert'}
                    className={`text-xs font-medium ${jsonStatus.ok ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    {jsonStatus.text}
                  </span>
                )}
                <button
                  onClick={handleSaveJsonThemes}
                  className="px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary-foreground, #000000)',
                  }}
                >
                  Save & Apply Custom Presets
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
