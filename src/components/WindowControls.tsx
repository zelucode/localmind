import React, { useCallback, useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Copy } from 'lucide-react';

async function withWindow(fn: (win: ReturnType<typeof getCurrentWindow>) => Promise<void>): Promise<void> {
  try {
    await fn(getCurrentWindow());
  } catch {
    // Running in a plain browser (pnpm dev) -- caption buttons no-op.
  }
}

/** Close the app window (no-op outside Tauri). */
export function closeWindow(): Promise<void> {
  return withWindow((win) => win.close());
}

/**
 * Draggable title-bar region. Children are click-through so the drag handle
 * stays continuous; interactive children opt back in with a `button` element.
 * Double-click toggles maximize.
 */
export const TitleBarDragRegion: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => {
  const onDoubleClick = useCallback(() => {
    void withWindow((win) => win.toggleMaximize());
  }, []);

  return (
    <div
      data-tauri-drag-region
      onDoubleClick={onDoubleClick}
      className={`[&_*]:pointer-events-none [&_button]:pointer-events-auto ${className ?? ''}`}
    >
      {children}
    </div>
  );
};

/** Custom minimize / maximize / close buttons, flush to the top-right corner at full bar height. */
export const WindowControls: React.FC<{ className?: string }> = ({ className }) => {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    void (async () => {
      try {
        const win = getCurrentWindow();
        if (!cancelled) setMaximized(await win.isMaximized());
        unlisten = await win.onResized(async () => {
          try {
            if (!cancelled) setMaximized(await win.isMaximized());
          } catch {
            /* ignore */
          }
        });
      } catch {
        /* no Tauri */
      }
    })();
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  const btn =
    'h-full w-11 flex items-center justify-center transition-colors cursor-pointer focus:outline-none opacity-70 hover:opacity-100 hover:bg-[var(--theme-raised)]';

  return (
    <div className={`flex items-stretch h-full shrink-0 ${className ?? ''}`} style={{ color: 'var(--theme-text)' }}>
      <button
        type="button"
        title="Minimize"
        aria-label="Minimize"
        className={btn}
        onClick={() => void withWindow((win) => win.minimize())}
      >
        <Minus className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
      <button
        type="button"
        title={maximized ? 'Restore' : 'Maximize'}
        aria-label={maximized ? 'Restore' : 'Maximize'}
        className={btn}
        onClick={() => void withWindow((win) => win.toggleMaximize())}
      >
        {maximized ? (
          <Copy className="w-3 h-3 rotate-90" strokeWidth={2} />
        ) : (
          <Square className="w-3 h-3" strokeWidth={2} />
        )}
      </button>
      <button
        type="button"
        title="Close"
        aria-label="Close"
        className={`${btn} hover:!bg-[var(--theme-danger)] hover:!text-[var(--theme-danger-foreground)]`}
        onClick={() => void withWindow((win) => win.close())}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  );
};
