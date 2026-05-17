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
  icon?: React.ElementType;
  rightAside?: ReactNode;
}

export function Wizard<TData extends Record<string, any>>({
  steps,
  initialData,
  onComplete,
  completeLabel = 'Terminer',
  title,
  subtitle,
  icon: HeaderIcon,
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
      <div className="w-full overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-brand-50 to-teal-50 dark:from-brand-900/20 dark:to-teal-900/20">
          <div className="flex items-center space-x-3">
            {HeaderIcon && (
              <div className="p-2 bg-brand-600 rounded-lg">
                <HeaderIcon className="text-white" size={24} />
              </div>
            )}
            <div>
              {title && <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle || `Étape ${stepIndex + 1} sur ${steps.length}`}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max">
            {steps.map((s, idx) => {
              const active = idx === stepIndex;
              const done = idx < stepIndex;
              const StepIcon = s.icon;
              return (
                <React.Fragment key={s.key}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => idx <= stepIndex && setStepIndex(idx)}
                      disabled={idx > stepIndex}
                      className={clsx(
                        'flex items-center justify-center w-10 h-10 rounded-full transition-all shrink-0',
                        done ? 'bg-teal-500 text-white cursor-pointer hover:bg-teal-600' :
                        active ? 'bg-brand-600 text-white shadow-md cursor-pointer' :
                        'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      )}
                      aria-current={active ? 'step' : undefined}
                    >
                      {done ? <Check size={20} aria-hidden="true" /> : StepIcon ? <StepIcon size={20} /> : idx + 1}
                    </button>
                    <div className="ml-3 hidden md:block text-left">
                      <p className={clsx(
                        "text-sm font-semibold",
                        (active || done) ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"
                      )}>
                        {s.title}
                      </p>
                      {s.description && <p className="text-xs text-gray-500 dark:text-gray-400">{s.description}</p>}
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={clsx(
                      "flex-1 h-1 mx-4 rounded min-w-[2rem]",
                      done ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-800'
                    )} aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 p-6 lg:p-8 min-h-[400px]">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="text-center w-full mb-2">
                {currentStep.icon && <currentStep.icon size={48} className="mx-auto text-brand-600 dark:text-brand-400 mb-3" />}
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentStep.title}
                </h4>
                {(currentStep.subtitle || currentStep.description) && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {currentStep.subtitle || currentStep.description}
                  </p>
                )}
              </div>
              {currentStep.helpContent && (
                <div className="absolute right-8">
                  <HelpButton
                    title={currentStep.helpTitle || currentStep.title}
                    content={currentStep.helpContent}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-5">
              {currentStep.render(ctx)}
            </div>

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
          </div>

          {rightAside && (
            <aside className="hidden lg:block w-72 shrink-0 h-full">
              <div className="sticky top-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-200 dark:border-violet-900 rounded-xl p-5">
                {rightAside}
              </div>
            </aside>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={isFirst || submitting}
            icon={<ChevronLeft size={16} aria-hidden="true" />}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Précédent
          </Button>
          {!isLast ? (
            <Button onClick={goNext} className="bg-brand-600 hover:bg-brand-700 text-white" icon={<ChevronRight size={16} aria-hidden="true" />}>
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              loading={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              icon={<Check size={16} aria-hidden="true" />}
            >
              {completeLabel}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
