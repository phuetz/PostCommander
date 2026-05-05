import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { TONES, type ToneId } from '@postcommander/shared';

interface ToneSelectorProps {
  selected: ToneId;
  onChange: (tone: ToneId) => void;
}

export function ToneSelector({ selected, onChange }: ToneSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('generate.tone', 'Tone')}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TONES.map((tone) => {
          const isSelected = selected === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => onChange(tone.id as ToneId)}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 text-left',
                isSelected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800',
              )}
            >
              <span className="text-lg flex-shrink-0">{tone.emoji}</span>
              <span className="truncate">
                {t(tone.labelKey, tone.id)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
