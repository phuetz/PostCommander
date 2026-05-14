import { useState, useMemo, useCallback, type ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HelpButton } from './HelpButton';
import type { WizardStep, WizardStepContext } from './types';

interface WizardProps<TData extends Record<string, any>> {
  steps: WizardStep<TData>[];
  initialData: TData;
  onComplete: (data: TData) => Promise<void> | void;
  completeLabel?: string;
  title?: string;
  subtitle?: string;
  rightAside?: ReactNode;
}

export function Wizard<TData extends Record<string, any>>({
  steps,
  initialData,
  onComplete,
  completeLabel = 'Terminer',
  title,
  subtitle,
  rightAside,
}: WizardProps<TData>) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setDataState] = useState<TData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentStep = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const setData = useCallback((updates: Partial<TData>) => {
    setDataState((prev) => ({ ...prev, ...updates }));
    setErrors({});
  }, []);

  const validateCurrent = useCallback((): boolean => {
    if (!currentStep.validate) return true;
    const result = currentStep.validate(data);
    if (result && Object.keys(result).length > 0) {
      setErrors(result);
      return false;
    }
    setErrors({});
    return true;
  }, [currentStep, data]);

  const goNext = useCallback(() => {
    if (!validateCurrent()) return;
    if (isLast) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [validateCurrent, isLast, steps.length]);

  const goPrev = useCallback(() => {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleComplete = useCallback(async () => {
    if (!validateCurrent()) return;
    setSubmitting(true);
    try {
      await onComplete(data);
    } finally {
      setSubmitting(false);
    }
  }, [validateCurrent, onComplete, data]);

  const ctx: WizardStepContext<TData> = useMemo(
    () => ({
      data,
      setData,
      errors,
      goNext,
      goPrev,
    }),
    [data, setData, errors, goNext, goPrev],
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col gap-2">
        {title && (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        )}
        {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
      </header>

      {/* Stepper */}
      <ol className="flex items-center gap-2 overflow-x-auto pb-2" aria-label="Étapes">
        {steps.map((s, idx) => {
          const active = idx === stepIndex;
          const done = idx < stepIndex;
          return (
            <li key={s.key} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => idx <= stepIndex && setStepIndex(idx)}
                disabled={idx > stepIndex}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  active && 'bg-brand-600 text-white shadow-sm',
                  done &&
                    'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 cursor-pointer hover:bg-brand-200',
                  !active &&
                    !done &&
                    'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed',
                )}
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={clsx(
                    'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                    active && 'bg-white/20',
                    done && 'bg-brand-600 text-white',
                    !active && !done && 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                  )}
                >
                  {done ? <Check size={12} aria-hidden="true" /> : idx + 1}
                </span>
                {s.title}
              </button>
              {idx < steps.length - 1 && (
                <span className="w-4 h-px bg-gray-300 dark:bg-gray-700" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 lg:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentStep.title}
              </h2>
              {currentStep.subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {currentStep.subtitle}
                </p>
              )}
            </div>
            {currentStep.helpContent && (
              <HelpButton
                title={currentStep.helpTitle || currentStep.title}
                content={currentStep.helpContent}
              />
            )}
          </div>

          <div className="space-y-5">{currentStep.render(ctx)}</div>

          {/* Errors summary */}
          {Object.keys(errors).length > 0 && (
            <div
              role="alert"
              className="mt-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300"
            >
              <ul className="list-disc list-inside space-y-0.5">
                {Object.entries(errors).map(([k, v]) => (
                  <li key={k}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={isFirst || submitting}
              icon={<ChevronLeft size={16} aria-hidden="true" />}
            >
              Précédent
            </Button>
            {!isLast ? (
              <Button onClick={goNext} icon={<ChevronRight size={16} aria-hidden="true" />}>
                Suivant
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                loading={submitting}
                icon={<Check size={16} aria-hidden="true" />}
              >
                {completeLabel}
              </Button>
            )}
          </div>
        </div>

        {rightAside && (
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-200 dark:border-violet-900 rounded-xl p-5">
              {rightAside}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
