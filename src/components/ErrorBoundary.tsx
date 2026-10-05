import React from 'react';
import { AlertTriangle, Copy, Check, RefreshCw, RotateCcw, Power } from 'lucide-react';
import { logError } from '../lib/errorLog';
import { TitleBarDragRegion, WindowControls, closeWindow } from './WindowControls';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string;
}

/** Plain-text report the user can paste into an issue. */
export function describeError(error: Error, componentStack = ''): string {
  return [
    `LocalMind crash report`,
    `Time: ${new Date().toISOString()}`,
    `Error: ${error.name}: ${error.message}`,
    '',
    error.stack ? `Stack:\n${error.stack}` : '',
    componentStack ? `Component stack:${componentStack}` : '',
  ]
    .filter((line, i, all) => line !== '' || (all[i - 1] ?? '') !== '')
    .join('\n')
    .trim();
}

const CrashScreen: React.FC<{
  error: Error;
  componentStack: string;
  onTryAgain: () => void;
}> = ({ error, componentStack, onTryAgain }) => {
  const [copied, setCopied] = React.useState(false);
  const report = describeError(error, componentStack);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the details are still visible below to select by hand.
    }
  };

  const btn =
    'px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:opacity-85 active:scale-95';
  const secondary = {
    backgroundColor: 'var(--theme-raised, #313147)',
    borderColor: 'var(--theme-border, #3a3a52)',
    color: 'var(--theme-text, #d8dbe8)',
  };

  return (
    <div
      id="app-crash-screen"
      role="alert"
      className="fixed inset-0 z-[10000] flex flex-col"
      style={{ backgroundColor: 'var(--theme-bg, #1e1e2e)', color: 'var(--theme-text, #d8dbe8)' }}
    >
      {/* Its own title bar: the normal one lives inside the app that just crashed. */}
      <div
        className="h-11 shrink-0 flex items-stretch border-b select-none"
        style={{ backgroundColor: 'var(--theme-card, #282838)', borderColor: 'var(--theme-border, #3a3a52)' }}
      >
        <TitleBarDragRegion className="flex-1 flex items-center px-4 text-sm font-bold tracking-tight">
          LocalMind
        </TitleBarDragRegion>
        <WindowControls />
      </div>

      <div className="flex-1 overflow-y-auto grid place-items-center p-6">
        <div
          className="w-full max-w-xl rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: 'var(--theme-card, #282838)', borderColor: 'var(--theme-border, #3a3a52)' }}
        >
          <div className="flex items-start gap-3">
            <span
              className="p-2 rounded-xl shrink-0"
              style={{ backgroundColor: 'var(--theme-raised, #313147)', color: 'var(--theme-primary, #e0a8c5)' }}
            >
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-bold">Something went wrong</h1>
              <p className="text-xs mt-1" style={{ color: 'var(--theme-text-secondary, #a9adc4)' }}>
                LocalMind hit an unexpected error and stopped this screen. Your tools, bookmarks and saved keys are not
                affected.
              </p>
            </div>
          </div>

          <pre
            className="text-[11px] rounded-lg border p-3 overflow-x-auto whitespace-pre-wrap break-words"
            style={{ backgroundColor: 'var(--theme-bg, #1e1e2e)', borderColor: 'var(--theme-border, #3a3a52)' }}
          >
            {error.name}: {error.message}
          </pre>

          <details className="text-[11px]" style={{ color: 'var(--theme-text-secondary, #a9adc4)' }}>
            <summary className="cursor-pointer select-none">Technical details</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words">{report}</pre>
          </details>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              id="btn-crash-try-again"
              onClick={onTryAgain}
              className={btn}
              style={{ backgroundColor: 'var(--theme-primary, #e0a8c5)', borderColor: 'transparent', color: 'var(--theme-primary-foreground, #1e1e2e)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
            <button id="btn-crash-reload" onClick={() => window.location.reload()} className={btn} style={secondary}>
              <RefreshCw className="w-3.5 h-3.5" /> Reload app
            </button>
            <button id="btn-crash-copy" onClick={copy} className={btn} style={secondary}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy details'}
            </button>
            <button id="btn-crash-close" onClick={() => void closeWindow()} className={`${btn} ml-auto`} style={secondary}>
              <Power className="w-3.5 h-3.5" /> Close app
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Catches render errors anywhere below it and shows a recovery screen that has its own
 * window controls, so a crash can never leave a frameless window with no way out.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError('app', 'The app crashed while rendering', error);
    this.setState({ componentStack: info.componentStack ?? '' });
  }

  render() {
    if (this.state.error) {
      return (
        <CrashScreen
          error={this.state.error}
          componentStack={this.state.componentStack}
          onTryAgain={() => this.setState({ error: null, componentStack: '' })}
        />
      );
    }
    return this.props.children;
  }
}
