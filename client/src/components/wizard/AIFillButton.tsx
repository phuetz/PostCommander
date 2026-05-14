import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useFieldAssist } from '@/hooks/useFieldAssist';
import type { AssistFieldKey } from './types';

interface AIFillButtonProps {
  field: AssistFieldKey;
  context?: Record<string, unknown>;
  onFilled: (value: string) => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function AIFillButton({
  field,
  context,
  onFilled,
  label,
  className,
  size = 'sm',
}: AIFillButtonProps) {
  const { mutateAsync, isPending } = useFieldAssist();
  const [showAlts, setShowAlts] = useState<string[] | null>(null);

  const handleClick = async () => {
    try {
      const result = await mutateAsync({ field, context });
      onFilled(result.suggestion);
      if (result.alternatives && result.alternatives.length > 0) {
        setShowAlts(result.alternatives);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI assist failed';
      toast.error(message);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
        title="Suggérer avec l'IA"
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-md font-medium',
          'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
          'hover:from-violet-600 hover:to-purple-600',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'transition-all duration-150 shadow-sm',
          size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
          className,
        )}
      >
        <Sparkles
          size={size === 'sm' ? 12 : 14}
          aria-hidden="true"
          className={isPending ? 'animate-pulse' : ''}
        />
        {label || (isPending ? 'IA...' : 'IA')}
      </button>
      {showAlts && (
        <div className="flex flex-wrap gap-1 max-w-md">
          {showAlts.map((alt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onFilled(alt);
                setShowAlts(null);
              }}
              className="text-xs px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
            >
              {alt.length > 40 ? `${alt.slice(0, 40)}…` : alt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAlts(null)}
            className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
