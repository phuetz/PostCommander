import { useTranslation } from 'react-i18next';
import { Linkedin, Twitter, Facebook, Instagram, Music, Pin } from 'lucide-react';
import clsx from 'clsx';
import { PLATFORMS, type PlatformId } from '@postcommander/shared';

interface PlatformSelectorProps {
  selected: PlatformId[];
  onChange: (platforms: PlatformId[]) => void;
}

const platformIcons: Record<PlatformId, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  pinterest: Pin,
};

const platformIds = Object.keys(PLATFORMS) as PlatformId[];

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const { t } = useTranslation();

  const togglePlatform = (id: PlatformId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('generate.platforms', 'Platforms')}
      </label>
      <div className="flex flex-wrap gap-2">
        {platformIds.map((id) => {
          const platform = PLATFORMS[id];
          const Icon = platformIcons[id];
          const isSelected = selected.includes(id);

          return (
            <button
              key={id}
              type="button"
              onClick={() => togglePlatform(id)}
              className={clsx(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150',
                isSelected
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800',
              )}
              style={isSelected ? { backgroundColor: platform.color } : undefined}
            >
              <Icon size={16} />
              <span>{platform.name}</span>
              <span
                className={clsx(
                  'text-xs',
                  isSelected ? 'text-white/80' : 'text-gray-400 dark:text-gray-500',
                )}
              >
                {platform.charLimit.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
