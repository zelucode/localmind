import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, CheckCircle, XCircle, ExternalLink, Copy, Check, Play, HelpCircle, Settings2 } from 'lucide-react';

import { probePorts, indexProbeResults } from '../lib/backend';

interface LocalServiceStatus {
  id: string;
  name: string;
  port: number;
  status: 'online' | 'offline' | 'checking';
  latency?: number;
  commandToStart: string;
  docsUrl: string;
}

interface OmniRouteWidgetProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export const OmniRouteWidget: React.FC<OmniRouteWidgetProps> = ({ onStatusChange }) => {
  const [services, setServices] = useState<LocalServiceStatus[]>([
    {
      id: 'omniroute',
      name: 'OmniRoute Gateway',
      port: 8000,
      status: 'offline',
      commandToStart: 'omniroute start --port 8000',
      docsUrl: 'https://github.com/danielfrg/omniroute',
    },
    {
      id: 'ollama',
      name: 'Ollama Daemon',
      port: 11434,
      status: 'offline',
      commandToStart: 'ollama serve',
      docsUrl: 'https://ollama.com',
    },
    {
      id: 'lmstudio',
      name: 'LM Studio Server',
      port: 1234,
      status: 'offline',
      commandToStart: 'Launch LM Studio -> Start Local Server',
      docsUrl: 'https://lmstudio.ai',
    },
    {
      id: 'jan',
      name: 'Jan.ai Cortex Server',
      port: 1337,
      status: 'offline',
      commandToStart: 'jan --server',
      docsUrl: 'https://jan.ai',
    },
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [customPortText, setCustomPortText] = useState('8000');
  const [customPortError, setCustomPortError] = useState<string | null>(null);
  const [customStatus, setCustomStatus] = useState<'idle' | 'online' | 'offline'>('idle');
  const [customLatency, setCustomLatency] = useState<number | null>(null);

  const scanServices = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const results = indexProbeResults(await probePorts(services.map((s) => s.port)));
      const next = services.map((s) => {
        const r = results.get(s.port);
        return {
          ...s,
          status: r?.online ? ('online' as const) : ('offline' as const),
          latency: r?.online ? r.latencyMs ?? undefined : undefined,
        };
      });
      setServices(next);
      onStatusChange?.(next.find((s) => s.id === 'omniroute')?.status === 'online');
    } catch (err) {
      // Never pretend a service is up when we couldn't check.
      setScanError(err instanceof Error ? err.message : 'Could not scan local ports.');
      setServices((prev) => prev.map((s) => ({ ...s, status: 'offline' as const, latency: undefined })));
      onStatusChange?.(false);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanServices();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const testCustomPort = async () => {
    const port = Number(customPortText.trim());
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      setCustomPortError('Enter a port between 1 and 65535.');
      setCustomStatus('idle');
      return;
    }
    setCustomPortError(null);
    try {
      const [result] = await probePorts([port]);
      setCustomStatus(result?.online ? 'online' : 'offline');
      setCustomLatency(result?.latencyMs ?? null);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Could not check that port.');
      setCustomStatus('offline');
      setCustomLatency(null);
    }
  };

  const omniRouteSvc = services.find((s) => s.id === 'omniroute');
  const isOmniOnline = omniRouteSvc?.status === 'online';

  return (
    <div
      id="section-omniroute"
      className="border rounded-xl p-5 mb-8 shadow-sm scroll-mt-20 transition-colors"
      style={{
        backgroundColor: 'var(--theme-card)',
        borderColor: 'var(--theme-border)',
        color: 'var(--theme-text)',
      }}
    >
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex items-start gap-3">
          <div
            className="p-2.5 rounded-xl border"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-primary)',
            }}
          >
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--theme-text)' }}>
                OmniRoute & Local AI Daemon Monitor
              </h2>
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border"
                style={{
                  backgroundColor: 'var(--theme-raised)',
                  borderColor: isOmniOnline ? '#10b981' : 'var(--theme-border)',
                  color: isOmniOnline ? '#10b981' : 'var(--theme-text-muted)',
                }}
              >
                {isOmniOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    OmniRoute Active
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full opacity-40" style={{ backgroundColor: 'var(--theme-text)' }}></span>
                    OmniRoute Standby
                  </>
                )}
              </span>
            </div>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
              Uniform gateway that pools free-tier models (Groq, Gemini, OpenRouter :free) and local Ollama into a single local API port.
            </p>
            {scanError && (
              <p role="alert" className="text-xs mt-1.5 font-medium" style={{ color: 'var(--theme-danger, #f43f5e)' }}>
                {scanError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
          <button
            id="btn-scan-local-services"
            onClick={scanServices}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 cursor-pointer hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} style={{ color: 'var(--theme-primary)' }} />
            {isScanning ? 'Scanning Ports...' : 'Scan Local Ports'}
          </button>

          <button
            id="btn-toggle-omni-guide"
            onClick={() => setShowConfigHelp(!showConfigHelp)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-primary)',
            }}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showConfigHelp ? 'Hide Setup Guide' : 'How to Run OmniRoute'}
          </button>
        </div>
      </div>

      {/* Expandable Setup Guide */}
      {showConfigHelp && (
        <div
          className="mt-4 p-4 rounded-lg border text-xs space-y-3 animate-in fade-in"
          style={{
            backgroundColor: 'var(--theme-raised)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-secondary)',
          }}
        >
          <div className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--theme-primary)' }}>
            <Play className="w-4 h-4" />
            How to install and run OmniRoute for free AI pooling:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="font-medium" style={{ color: 'var(--theme-text)' }}>1. Install OmniRoute CLI:</span>
              <div
                className="flex items-center justify-between px-2.5 py-1.5 rounded border font-mono text-[11px]"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <code>npm install -g omniroute</code>
                <button
                  onClick={() => copyToClipboard('npm install -g omniroute', 'install-omni')}
                  className="p-1 cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text)' }}
                  title="Copy command"
                >
                  {copiedCmd === 'install-omni' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <span className="font-medium" style={{ color: 'var(--theme-text)' }}>2. Start on port 8000:</span>
              <div
                className="flex items-center justify-between px-2.5 py-1.5 rounded border font-mono text-[11px]"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)',
                }}
              >
                <code>omniroute start --port 8000</code>
                <button
                  onClick={() => copyToClipboard('omniroute start --port 8000', 'start-omni')}
                  className="p-1 cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text)' }}
                  title="Copy command"
                >
                  {copiedCmd === 'start-omni' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
          <p className="leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            <strong style={{ color: 'var(--theme-text)' }}>Why use OmniRoute?</strong> It routes requests across multiple free API keys (Gemini, Groq, OpenRouter :free models) and local Ollama without modifying your client code. You can point Cursor, Aider, or VSCode to <code className="px-1 py-0.5 rounded border" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)', color: 'var(--theme-primary)' }}>http://localhost:8000/v1</code> as a standard OpenAI drop-in endpoint.
          </p>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {services.map((svc) => {
          const isOnline = svc.status === 'online';
          return (
            <div
              key={svc.id}
              className="p-3.5 rounded-lg border transition-all"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: isOnline ? 'var(--theme-primary)' : 'var(--theme-border)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--theme-text)' }}>
                    {svc.name}
                  </span>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 border"
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderColor: isOnline ? '#10b981' : 'var(--theme-border)',
                    color: isOnline ? '#10b981' : 'var(--theme-text-muted)',
                  }}
                >
                  {isOnline ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      Online {svc.latency ? `(${svc.latency}ms)` : ''}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 opacity-50" />
                      Offline
                    </>
                  )}
                </span>
              </div>

              <div className="text-[11px] flex items-center justify-between mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                <span className="font-mono">Port {svc.port}</span>
                <a
                  href={svc.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-[10px] hover:underline"
                  style={{ color: 'var(--theme-primary)' }}
                >
                  Docs <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              <div
                className="rounded p-1.5 border flex items-center justify-between gap-1"
                style={{
                  backgroundColor: 'var(--theme-card)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <span className="text-[10px] font-mono truncate" style={{ color: 'var(--theme-text-secondary)' }}>
                  {svc.commandToStart}
                </span>
                <button
                  onClick={() => copyToClipboard(svc.commandToStart, svc.id)}
                  className="p-1 shrink-0 cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: 'var(--theme-text)' }}
                  title="Copy start command"
                >
                  {copiedCmd === svc.id ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Custom Port Checker */}
      <div className="mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" style={{ borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--theme-text-secondary)' }}>
          <Settings2 className="w-3.5 h-3.5 opacity-60" />
          <span>Test another local AI server port:</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center border rounded px-2 py-1"
            style={{
              backgroundColor: 'var(--theme-card)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <span className="font-mono text-xs mr-1" style={{ color: 'var(--theme-text-muted)' }}>localhost:</span>
            <input
              id="input-custom-port"
              type="text"
              inputMode="numeric"
              aria-label="Port to check"
              aria-invalid={customPortError ? true : undefined}
              value={customPortText}
              onChange={(e) => {
                setCustomPortText(e.target.value.replace(/[^0-9]/g, '').slice(0, 5));
                setCustomPortError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void testCustomPort();
              }}
              className="w-16 bg-transparent font-mono text-xs focus:outline-none"
              style={{ color: 'var(--theme-text)' }}
            />
          </div>
          <button
            id="btn-test-custom-port"
            onClick={testCustomPort}
            className="px-2.5 py-1 rounded border font-medium cursor-pointer transition-colors hover:opacity-85"
            style={{
              backgroundColor: 'var(--theme-raised)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)',
            }}
          >
            Check Port
          </button>
          {customPortError && (
            <span role="alert" className="text-xs font-medium" style={{ color: 'var(--theme-danger, #f43f5e)' }}>
              {customPortError}
            </span>
          )}
          {customStatus !== 'idle' && (
            <span
              className="text-xs px-2 py-0.5 rounded font-medium border"
              style={{
                backgroundColor: 'var(--theme-raised)',
                borderColor: customStatus === 'online' ? '#10b981' : '#f43f5e',
                color: customStatus === 'online' ? '#10b981' : '#f43f5e',
              }}
            >
              {customStatus === 'online' ? `Online (${customLatency}ms)` : 'Unreachable'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
