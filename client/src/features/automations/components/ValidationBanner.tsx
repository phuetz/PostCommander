import { useState } from 'react';
import { AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { ValidationIssue } from '../utils/validate-workflow';

interface ValidationBannerProps {
  issues: ValidationIssue[];
  onSelectNode?: (nodeId: string) => void;
}

export function ValidationBanner({ issues, onSelectNode }: ValidationBannerProps) {
  const [expanded, setExpanded] = useState(false);
  if (issues.length === 0) return null;

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const hasError = errors.length > 0;

  const Icon = hasError ? AlertCircle : AlertTriangle;
  const palette = hasError
    ? {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-900/50',
        text: 'text-red-700 dark:text-red-400',
      }
    : {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-900/50',
        text: 'text-amber-700 dark:text-amber-400',
      };

  return (
    <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 max-w-2xl w-[90%] rounded-xl border ${palette.bg} ${palette.border} shadow-lg backdrop-blur-sm`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <div className={`flex items-center gap-2 ${palette.text}`}>
          <Icon size={14} />
          <span className="text-xs font-bold">
            {errors.length > 0 && `${errors.length} erreur${errors.length > 1 ? 's' : ''}`}
            {errors.length > 0 && warnings.length > 0 && ' · '}
            {warnings.length > 0 && `${warnings.length} avertissement${warnings.length > 1 ? 's' : ''}`}
          </span>
        </div>
        {expanded ? <ChevronUp size={13} className={palette.text} /> : <ChevronDown size={13} className={palette.text} />}
      </button>

      {expanded && (
        <div className="border-t border-current/10 max-h-48 overflow-y-auto">
          {issues.map((issue, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => issue.nodeId && onSelectNode?.(issue.nodeId)}
              disabled={!issue.nodeId}
              className={`w-full flex items-start gap-2 px-3 py-2 text-left text-[11px] hover:bg-white/40 dark:hover:bg-gray-900/40 transition-colors ${
                issue.nodeId ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span
                className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  issue.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-gray-700 dark:text-gray-300">{issue.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
