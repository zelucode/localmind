import React, { useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';

interface ConfirmDeleteButtonProps {
  /** What is being deleted, used in the accessible names ("Delete Foo"). */
  name: string;
  onConfirm: () => void;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ARMED_MS = 4000;

/**
 * A delete icon that needs a second click. The first click turns it into a red "Confirm" button for a few
 * seconds (or until it loses focus); only the second click deletes. It never uses window.confirm.
 */
export const ConfirmDeleteButton: React.FC<ConfirmDeleteButtonProps> = ({ name, onConfirm, id, className, style }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), ARMED_MS);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      id={id}
      type="button"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      onBlur={() => setArmed(false)}
      title={armed ? `Click again to delete ${name}` : `Delete ${name}`}
      aria-label={armed ? `Confirm delete ${name}` : `Delete ${name}`}
      className={`${className ?? ''} ${armed ? 'flex items-center gap-1 px-2 text-[11px] font-semibold' : ''}`}
      style={armed ? { ...style, backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#ffffff' } : style}
    >
      {armed ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Delete?</span>
        </>
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
    </button>
  );
};
