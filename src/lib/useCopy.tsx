import React, { useCallback, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { copyText } from './files';

export type CopyStatus = 'idle' | 'copied' | 'failed';

/**
 * Clipboard feedback for lists of copy buttons: `copy(text, id)` reports whether the clipboard accepted the text,
 * and `statusOf(id)` says what that button should show for the next couple of seconds.
 */
export function useCopyFeedback(resetMs = 2000) {
  const [last, setLast] = useState<{ id: string; ok: boolean } | null>(null);

  const copy = useCallback(
    async (text: string, id: string) => {
      const ok = await copyText(text);
      setLast({ id, ok });
      setTimeout(() => setLast((cur) => (cur && cur.id === id ? null : cur)), resetMs);
      return ok;
    },
    [resetMs],
  );

  const statusOf = (id: string): CopyStatus => (last?.id === id ? (last.ok ? 'copied' : 'failed') : 'idle');

  return { copy, statusOf };
}

/** Copy icon that turns into a check on success and a red X when the clipboard refused. */
export const CopyStatusIcon: React.FC<{ status: CopyStatus; className?: string }> = ({ status, className = 'w-3.5 h-3.5' }) => {
  if (status === 'copied') return <Check className={`${className} text-emerald-500`} />;
  if (status === 'failed') return <X className={`${className} text-rose-500`} />;
  return <Copy className={className} />;
};
