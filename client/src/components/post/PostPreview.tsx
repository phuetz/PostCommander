import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Music,
  Pin,
  Pencil,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { PLATFORMS, type PlatformId } from '@postcommander/shared';
import { CopyButton } from './CopyButton';
import { PostEditor } from './PostEditor';

import { useAuth } from '@/hooks/useAuth';
import { SocialMockup } from './SocialMockup';

interface PostPreviewProps {
  platforms: PlatformId[];
  platformVariants: Record<string, string>;
  onVariantChange?: (platform: string, content: string) => void;
  streaming?: boolean;
  streamedContent?: string;
}

const platformIcons: Record<PlatformId, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  pinterest: Pin,
};

export function PostPreview({
  platforms,
  platformVariants,
  onVariantChange,
  streaming = false,
  streamedContent = '',
}: PostPreviewProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PlatformId>(
    platforms[0] || 'linkedin',
  );
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);

  if (platforms.length === 0) return null;

  const activePlatform = PLATFORMS[activeTab];
  const content =
    platformVariants[activeTab] || streamedContent || '';
  const charCount = content.length;
  const charLimit = activePlatform?.charLimit || 0;
  const ratio = charLimit > 0 ? charCount / charLimit : 0;

  const getCharColor = () => {
    if (ratio > 1) return 'text-red-500';
    if (ratio > 0.9) return 'text-amber-500';
    return 'text-green-500';
  };

  const getBarColor = () => {
    if (ratio > 1) return 'bg-red-500';
    if (ratio > 0.9) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {platforms.map((pid) => {
          const platform = PLATFORMS[pid];
          const Icon = platformIcons[pid];
          const isActive = activeTab === pid;

          return (
            <button
              key={pid}
              onClick={() => setActiveTab(pid)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-current text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
              )}
              style={isActive ? { color: platform.color } : undefined}
            >
              <Icon size={16} />
              {platform.name}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="p-5">
        {editingPlatform === activeTab ? (
          <PostEditor
            content={content}
            charLimit={charLimit}
            onSave={(newContent) => {
              onVariantChange?.(activeTab, newContent);
              setEditingPlatform(null);
            }}
            onCancel={() => setEditingPlatform(null)}
          />
        ) : (
          <>
            {/* Live Mockup */}
            <div className="relative min-h-[120px]">
              <SocialMockup
                platform={activeTab}
                content={content || (
                  streaming
                    ? t('generate.streaming', 'Generating...')
                    : t('generate.previewPlaceholder', 'Generated content will appear here')
                )}
                userName={user?.name || 'Your Name'}
                userHandle={user?.email.split('@')[0] || 'yourhandle'}
                userAvatar={user?.avatarUrl}
              />
              
              {streaming && (
                <div className="absolute bottom-2 right-2 flex items-center gap-2 px-2 py-1 rounded bg-brand-500/10 text-brand-600 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                  <Sparkles size={10} />
                  Streaming
                </div>
              )}
            </div>

            {/* Progress bar + actions */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-300',
                      getBarColor(),
                    )}
                    style={{
                      width: `${Math.min(ratio * 100, 100)}%`,
                    }}
                  />
                </div>
                <span
                  className={clsx(
                    'text-xs font-medium tabular-nums',
                    getCharColor(),
                  )}
                >
                  {charCount.toLocaleString()} / {charLimit.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {onVariantChange && (
                  <button
                    onClick={() => setEditingPlatform(activeTab)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Pencil size={14} />
                    {t('common.edit', 'Edit')}
                  </button>
                )}
                <CopyButton text={content} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
