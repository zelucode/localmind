import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BrandMark } from './BrandMark';

interface LoadingScreenProps {
  onFinish: () => void;
  durationMs?: number;
  totalTools?: number;
  totalBookmarks?: number;
}

const STATUS_STEPS: { until: number; label: string }[] = [
  { until: 25, label: 'Opening key vault' },
  { until: 50, label: 'Loading tool catalog' },
  { until: 75, label: 'Loading bookmarks' },
  { until: 101, label: 'Ready' },
];

/**
 * Layout note: the mark + wordmark block is centered exactly like the static boot
 * splash in index.html, so the handoff from splash to this screen is invisible.
 * Everything else fades in around it.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish, durationMs = 1200 }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const reduceMotion = useReducedMotion();

  const finish = useCallback(
    (delay: number) => {
      setIsExiting(true);
      setTimeout(onFinish, delay);
    },
    [onFinish]
  );

  useEffect(() => {
    const start = performance.now();
    let frame: number;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // ease-out so the line settles instead of stopping dead
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        holdTimer = setTimeout(() => finish(300), 150);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [durationMs, finish]);

  // Skip with Escape / Space / Enter, or by clicking anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        finish(150);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  const status = STATUS_STEPS.find((s) => progress < s.until)?.label ?? 'Ready';

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="app-loading-screen"
          role="status"
          aria-live="polite"
          aria-label="Loading LocalMind"
          onClick={() => finish(150)}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] select-none cursor-default"
          style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
        >
          {/* Mark + wordmark: identical position and size to the boot splash */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-7">
            <BrandMark className="w-[88px] h-[88px]" style={{ color: 'var(--theme-primary)' }} />
            <div
              role="img"
              aria-label="LocalMind"
              style={{
                width: 176,
                height: 40,
                backgroundColor: 'var(--theme-text)',
                WebkitMask: 'url(/wordmark.svg) center / contain no-repeat',
                mask: 'url(/wordmark.svg) center / contain no-repeat',
              }}
            />

            {/* Tagline, progress line and status sit below the fixed center block */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.15 }}
              className="absolute top-full mt-5 w-64 flex flex-col items-center gap-5"
            >
              <p className="text-sm tracking-wide" style={{ color: 'var(--theme-text-secondary)' }}>
                Your private AI hub, always nearby.
              </p>

              <div
                className="w-full h-[2px] rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--theme-border)' }}
              >
                <div
                  className="h-full origin-left"
                  style={{
                    backgroundColor: 'var(--theme-primary)',
                    transform: `scaleX(${progress / 100})`,
                  }}
                />
              </div>

              <p className="text-[11px] tracking-wide h-4" style={{ color: 'var(--theme-text-muted)' }}>
                {status}
              </p>
            </motion.div>
          </div>

          <p
            className="absolute bottom-6 left-0 right-0 text-center text-[11px] tracking-wide"
            style={{ color: 'var(--theme-text-muted)', opacity: 0.7 }}
          >
            Press Space to skip
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
