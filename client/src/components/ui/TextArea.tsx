import { type TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  charLimit?: number;
  charCount?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { label, error, charLimit, charCount, className, id, ...props },
    ref,
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const currentCount = charCount ?? (typeof props.value === 'string' ? props.value.length : 0);
    const isOverLimit = charLimit ? currentCount > charLimit : false;
    const isNearLimit = charLimit ? currentCount > charLimit * 0.9 : false;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            'block w-full rounded-lg border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'px-3 py-2.5 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'resize-y',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        <div className="flex justify-between">
          {error && <p className="text-xs text-red-500">{error}</p>}
          {charLimit && (
            <p
              className={clsx(
                'text-xs ml-auto',
                isOverLimit
                  ? 'text-red-500 font-medium'
                  : isNearLimit
                    ? 'text-amber-500'
                    : 'text-gray-400',
              )}
            >
              {currentCount.toLocaleString()} / {charLimit.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';
