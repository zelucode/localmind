import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleDashed, Download, ExternalLink, Loader2, RefreshCw, TriangleAlert, Wrench, X } from 'lucide-react';
import {
  SetupDetectResult,
  SetupRecipe,
  cancelSetupInstall,
  detectSetupTools,
  installSetupTool,
  listSetupRecipes,
} from '../lib/backend';
import { BackendUnavailableError, openExternal } from '../lib/tauri';
import { CopyStatusIcon, useCopyFeedback } from '../lib/useCopy';
import { logError, logInfo } from '../lib/errorLog';

const MAX_LOG_LINES = 300;

type Detected = Record<string, SetupDetectResult | undefined>;

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

const card: React.CSSProperties = {
  backgroundColor: 'var(--theme-card)',
  borderColor: 'var(--theme-border)',
  color: 'var(--theme-text)',
};

export const SetupPage: React.FC = () => {
  const [recipes, setRecipes] = useState<SetupRecipe[] | null>(null);
  const [detected, setDetected] = useState<Detected>({});
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Install state: only one install runs at a time (the backend enforces it too).
  const [confirming, setConfirming] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<{ id: string; ok: boolean; message: string } | null>(null);
  const logRef = useRef<HTMLPreElement>(null);
  const { copy, statusOf } = useCopyFeedback();

  const detect = useCallback(async (list: SetupRecipe[]) => {
    setChecking(true);
    try {
      const found = await detectSetupTools(list.map((r) => r.id));
      setDetected(Object.fromEntries(found.map((d) => [d.id, d])));
    } catch (err) {
      setLoadError(messageOf(err));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    listSetupRecipes()
      .then((list) => {
        if (!alive) return;
        setRecipes(list);
        void detect(list);
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(messageOf(err));
        setChecking(false);
        if (!(err instanceof BackendUnavailableError)) logError('SetupPage', `Could not load recipes: ${messageOf(err)}`);
      });
    return () => {
      alive = false;
    };
  }, [detect]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const runInstall = async (recipe: SetupRecipe) => {
    setConfirming(null);
    setResult(null);
    setLog([]);
    setInstalling(recipe.id);
    logInfo('SetupPage', `Install confirmed by the user: ${recipe.id}`);
    try {
      const message = await installSetupTool(recipe.id, (line) => setLog((prev) => [...prev, line].slice(-MAX_LOG_LINES)));
      setResult({ id: recipe.id, ok: true, message });
    } catch (err) {
      setResult({ id: recipe.id, ok: false, message: messageOf(err) });
    } finally {
      setInstalling(null);
      if (recipes) void detect(recipes);
    }
  };

  if (loadError && !recipes) {
    return (
      <div className="border rounded-2xl p-6 text-sm" style={card} role="alert">
        <p className="font-semibold flex items-center gap-2">
          <TriangleAlert className="w-4 h-4 text-amber-500" /> Setup is not available
        </p>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Wrench className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
          One-click setup
        </h2>
        <p className="text-xs mt-1 max-w-2xl" style={{ color: 'var(--theme-text-secondary)' }}>
          Installs a few free tools for you. You always see the exact command first and confirm before anything runs, nothing is installed
          with admin rights, and the list is built into LocalMind.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => recipes && void detect(recipes)}
          disabled={!recipes || checking || !!installing}
          className="px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 cursor-pointer hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          Check again
        </button>
        {loadError && (
          <span role="alert" className="text-xs text-rose-500">
            {loadError}
          </span>
        )}
      </div>

      {!recipes ? (
        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          Loading...
        </p>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {recipes.map((r) => {
            const d = detected[r.id];
            const isInstalling = installing === r.id;
            const busyElsewhere = !!installing && !isInstalling;
            const res = result?.id === r.id ? result : null;
            return (
              <li key={r.id} id={`setup-recipe-${r.id}`} className="border rounded-xl p-4 flex flex-col gap-3 min-w-0" style={card}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{r.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                      {r.description}
                    </p>
                  </div>
                  <StatusBadge detected={d} checking={checking && !d} />
                </div>

                {d?.status === 'installed' && (d.version || d.location) && (
                  <p className="text-[11px] font-mono break-all" style={{ color: 'var(--theme-text-muted)' }}>
                    {d.version ? `Version ${d.version}` : `Found at ${d.location}`}
                  </p>
                )}

                {d?.status === 'missing-requirement' && (
                  <p className="text-xs text-amber-500">
                    {d.missing} is needed first, and it was not found.
                  </p>
                )}

                {r.command ? (
                  <div>
                    <p className="text-[11px] mb-1" style={{ color: 'var(--theme-text-muted)' }}>
                      Command{r.requires.length > 0 ? ` (needs ${r.requires.join(', ')})` : ''}
                    </p>
                    <div
                      className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
                      style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
                    >
                      <code className="text-[11px] font-mono flex-1 min-w-0 break-all">{r.command}</code>
                      <button
                        onClick={() => void copy(r.command!, r.id)}
                        aria-label={`Copy the ${r.name} command`}
                        title="Copy command"
                        className="p-1 rounded cursor-pointer opacity-70 hover:opacity-100 shrink-0"
                      >
                        <CopyStatusIcon status={statusOf(r.id)} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                    No one-click install on this system. Install it yourself from the website.
                  </p>
                )}

                {confirming === r.id && r.command && (
                  <div className="rounded-lg border p-3 text-xs space-y-2" style={{ borderColor: 'var(--theme-primary)' }} role="alertdialog" aria-label={`Confirm installing ${r.name}`}>
                    <p>
                      LocalMind will run <code className="font-mono">{r.command}</code> on this computer. Continue?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void runInstall(r)}
                        className="px-3 py-1.5 rounded-lg font-semibold cursor-pointer active:scale-95"
                        style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000000)' }}
                      >
                        Run it
                      </button>
                      <button
                        onClick={() => setConfirming(null)}
                        className="px-3 py-1.5 rounded-lg border cursor-pointer hover:opacity-85"
                        style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  {r.command && d?.status !== 'installed' && !isInstalling && (
                    <button
                      onClick={() => setConfirming(r.id)}
                      disabled={busyElsewhere || d?.status === 'missing-requirement' || confirming === r.id}
                      className="px-3 py-1.5 text-xs rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground, #000000)' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Install
                    </button>
                  )}
                  {isInstalling && (
                    <button
                      onClick={() => void cancelSetupInstall().catch((err) => setResult({ id: r.id, ok: false, message: messageOf(err) }))}
                      className="px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1.5 cursor-pointer hover:opacity-85"
                      style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)' }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel install
                    </button>
                  )}
                  <button
                    onClick={() => void openExternal(r.manualUrl)}
                    className="px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-1 cursor-pointer hover:underline"
                    style={{ color: 'var(--theme-primary)' }}
                  >
                    Website <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {isInstalling && (
                  <p className="text-xs flex items-center gap-1.5" role="status">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Installing {r.name}...
                  </p>
                )}

                {(isInstalling || res) && log.length > 0 && (
                  <pre
                    ref={logRef}
                    aria-label={`${r.name} install output`}
                    className="text-[11px] font-mono rounded-lg border p-2.5 max-h-48 overflow-auto whitespace-pre-wrap break-all"
                    style={{ backgroundColor: 'var(--theme-raised)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-secondary)' }}
                  >
                    {log.join('\n')}
                  </pre>
                )}

                {res && (
                  <p role="status" className={`text-xs font-medium ${res.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {res.message}
                    {res.ok && d?.status !== 'installed' && ' If it still shows Not installed, restart LocalMind so it picks up the new PATH.'}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ detected: SetupDetectResult | undefined; checking: boolean }> = ({ detected, checking }) => {
  if (checking || !detected) {
    return (
      <span className="text-[11px] flex items-center gap-1 shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
        <Loader2 className="w-3 h-3 animate-spin" /> Checking
      </span>
    );
  }
  if (detected.status === 'installed') {
    return (
      <span className="text-[11px] flex items-center gap-1 shrink-0 text-emerald-500 font-medium" title={detected.version ? `Version ${detected.version}` : detected.location ?? undefined}>
        <CheckCircle2 className="w-3.5 h-3.5" /> Installed
      </span>
    );
  }
  if (detected.status === 'missing-requirement') {
    return (
      <span className="text-[11px] flex items-center gap-1 shrink-0 text-amber-500 font-medium">
        <TriangleAlert className="w-3.5 h-3.5" /> Needs {detected.missing}
      </span>
    );
  }
  return (
    <span className="text-[11px] flex items-center gap-1 shrink-0" style={{ color: 'var(--theme-text-muted)' }}>
      <CircleDashed className="w-3.5 h-3.5" /> Not installed
    </span>
  );
};
