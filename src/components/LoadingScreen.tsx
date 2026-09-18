import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, ShieldCheck, Database, Globe, CheckCircle2 } from 'lucide-react';

interface LoadingScreenProps {
  onFinish: () => void;
  durationMs?: number;
  totalTools?: number;
  totalBookmarks?: number;
}

interface BootStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  threshold: number;
}

const BOOT_STEPS: BootStep[] = [
  { id: 'vault', label: 'Local Encrypted Key Vault', icon: ShieldCheck, threshold: 20 },
  { id: 'models', label: '50+ Frontier AI Models Matrix', icon: Cpu, threshold: 45 },
  { id: 'bookmarks', label: '270+ Developer Bookmarks Catalog', icon: Database, threshold: 70 },
  { id: 'omniroute', label: 'OmniRoute Multi-Provider Daemon', icon: Globe, threshold: 90 },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onFinish,
  durationMs = 1500,
  totalTools = 32,
  totalBookmarks = 270,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('Initializing LocalMind runtime...');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const startTime = performance.now();
    let animationFrameId: number;

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));

      setProgress(rawProgress);

      if (rawProgress < 25) {
        setCurrentStatus('Initializing local cryptographic storage & key vault...');
      } else if (rawProgress < 50) {
        setCurrentStatus(`Mounting ${totalTools}+ frontier AI models, rate limits & pricing...`);
      } else if (rawProgress < 75) {
        setCurrentStatus(`Hydrating ${totalBookmarks}+ curated developer bookmarks...`);
      } else if (rawProgress < 95) {
        setCurrentStatus('Synchronizing OmniRoute multi-provider daemon & telemetry...');
      } else {
        setCurrentStatus('All systems initialized. Launching workspace...');
      }

      if (rawProgress < 100) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Hold at 100% briefly for optical completion
        const exitTimer = setTimeout(() => {
          setIsExiting(true);
          const finishTimer = setTimeout(() => {
            onFinish();
          }, 350);
          return () => clearTimeout(finishTimer);
        }, 180);
        return () => clearTimeout(exitTimer);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [durationMs, onFinish, totalTools, totalBookmarks]);

  // Allow instant skip via keyboard (Escape or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsExiting(true);
        setTimeout(onFinish, 150);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFinish]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onFinish, 150);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="app-loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
          style={{
            backgroundColor: 'var(--theme-bg, #0f111a)',
            color: 'var(--theme-text, #f1f3f9)',
          }}
        >
          {/* Subtle Ambient Radial Backdrops */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20"
            style={{
              background: 'radial-gradient(circle, var(--theme-primary, #6366f1) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(var(--theme-text, #ffffff) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
            {/* Animated LocalMind Core Orb */}
            <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
              {/* Outer Pulsing Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.12, 1],
                  opacity: [0.25, 0.45, 0.25],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: 'var(--theme-primary, #6366f1)' }}
              />

              {/* Outer Counter-Rotating Segmented Orbit Ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed opacity-40"
                style={{ borderColor: 'var(--theme-primary, #6366f1)' }}
              />

              {/* Middle Rotating Ring with Accent Satellite */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full border border-t-2 border-r-transparent border-b-transparent border-l-transparent"
                style={{ borderTopColor: 'var(--theme-primary, #6366f1)' }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-lg"
                  style={{
                    backgroundColor: 'var(--theme-primary, #6366f1)',
                    boxShadow: '0 0 10px var(--theme-primary, #6366f1)',
                  }}
                />
              </motion.div>

              {/* Inner Core Node */}
              <motion.div
                animate={{
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border"
                style={{
                  backgroundColor: 'var(--theme-card, #1a1d2d)',
                  borderColor: 'var(--theme-border, #2d3148)',
                }}
              >
                <Sparkles
                  className="w-7 h-7 transition-colors"
                  style={{ color: 'var(--theme-primary, #6366f1)' }}
                />
              </motion.div>
            </div>

            {/* Brand Title & Archetype Badge */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-1.5 mb-6"
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  className="text-xs font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border font-semibold"
                  style={{
                    backgroundColor: 'var(--theme-raised, #24283b)',
                    borderColor: 'var(--theme-border, #32374e)',
                    color: 'var(--theme-primary, #6366f1)',
                  }}
                >
                  OmniRoute Core v3.2
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--theme-text)' }}>
                LocalMind
              </h1>
              <p className="text-xs tracking-wider uppercase font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                Desktop AI Command & Multi-Provider Engine
              </p>
            </motion.div>

            {/* Precision Loading Progress Bar */}
            <div className="w-full space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="truncate max-w-[260px] text-left" style={{ color: 'var(--theme-text-secondary)' }}>
                  {currentStatus}
                </span>
                <span className="font-bold shrink-0 ml-2" style={{ color: 'var(--theme-primary)' }}>
                  {progress}%
                </span>
              </div>

              {/* Track */}
              <div
                className="w-full h-2 rounded-full overflow-hidden p-0.5 border"
                style={{
                  backgroundColor: 'var(--theme-card, #1a1d2d)',
                  borderColor: 'var(--theme-border, #2d3148)',
                }}
              >
                <motion.div
                  className="h-full rounded-full transition-all duration-100 ease-out"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: 'var(--theme-primary, #6366f1)',
                    boxShadow: '0 0 12px var(--theme-primary, #6366f1)',
                  }}
                />
              </div>
            </div>

            {/* Real-time Subsystem Initialization Pills */}
            <div className="grid grid-cols-2 gap-2 w-full mb-8">
              {BOOT_STEPS.map((step) => {
                const isComplete = progress >= step.threshold;
                const IconComponent = step.icon;
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 p-2 rounded-lg border text-left transition-all duration-300"
                    style={{
                      backgroundColor: isComplete ? 'var(--theme-raised, #24283b)' : 'transparent',
                      borderColor: isComplete ? 'var(--theme-border-strong, #3e4460)' : 'var(--theme-border, #26293c)',
                      opacity: isComplete ? 1 : 0.45,
                    }}
                  >
                    {isComplete ? (
                      <CheckCircle2
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: 'var(--theme-primary, #6366f1)' }}
                      />
                    ) : (
                      <IconComponent
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: 'var(--theme-text-muted)' }}
                      />
                    )}
                    <span
                      className="text-[11px] font-medium truncate"
                      style={{ color: isComplete ? 'var(--theme-text)' : 'var(--theme-text-muted)' }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Skip Prompt */}
            <button
              id="btn-skip-loading"
              onClick={handleSkip}
              className="text-[11px] font-mono tracking-wide px-3 py-1.5 rounded-md transition-colors cursor-pointer border opacity-60 hover:opacity-100"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)',
                backgroundColor: 'var(--theme-card)',
              }}
            >
              Press <kbd className="px-1 py-0.5 rounded bg-black/30 font-semibold">Space</kbd> or click to skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
