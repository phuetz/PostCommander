import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Music,
  Pin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { LLMProviderId, ToneId, PlatformId } from '@postcommander/shared';
import { PLATFORMS } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ToneSelector } from '@/components/post/ToneSelector';
import { LLMSelector } from '@/components/post/LLMSelector';
import { repurposePost, type RepurposedContent } from '@/services/api';

const platformIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Music,
  pinterest: Pin,
};

const platformColors: Record<string, string> = {
  linkedin: '#0A66C2',
  twitter: '#000000',
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
  pinterest: '#BD081C',
};

const platformOptions = Object.entries(PLATFORMS).map(([id, p]) => ({
  value: id,
  label: p.name,
}));

const platformIds = Object.keys(PLATFORMS) as PlatformId[];

function RepurposedCard({ item }: { item: RepurposedContent }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const Icon = platformIcons[item.platform] || RefreshCw;
  const color = platformColors[item.platform] || '#6366f1';
  const platformData = PLATFORMS[item.platform as PlatformId];
  const charLimit = platformData?.charLimit || 3000;
  const isOverLimit = item.charCount > charLimit;

  const handleCopy = async () => {
    const fullText = item.hashtags.length > 0
      ? `${item.content}\n\n${item.hashtags.map((h) => `#${h}`).join(' ')}`
      : item.content;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success(t('post.copied', 'Copied!'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Platform header */}
      <div
        className="flex items-center gap-2.5 px-5 py-3 text-white"
        style={{ backgroundColor: color }}
      >
        <Icon size={18} />
        <span className="font-semibold text-sm">
          {platformData?.name || item.platform}
        </span>
        <span className="ml-auto text-xs text-white/70">
          {item.charCount.toLocaleString()} / {charLimit.toLocaleString()}
        </span>
      </div>

      <div className="p-5 space-y-3">
        {/* Content */}
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
          {item.content}
        </p>

        {/* Hashtags */}
        {item.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {item.hashtags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Character count warning */}
        {isOverLimit && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {t('repurpose.overLimit', 'Over character limit')}
          </div>
        )}

        {/* Copy button */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full justify-center ${
              copied
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied
              ? t('post.copied', 'Copied!')
              : t('repurpose.copyAdapted', 'Copy adapted content')}
          </button>
        </div>
      </div>
    </Card>
  );
}

export function RepurposePage() {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('linkedin');
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState<ToneId>('professional');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [results, setResults] = useState<RepurposedContent[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      repurposePost({
        content,
        sourcePlatform,
        targetPlatforms,
        tone,
        provider,
        model,
      }),
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t('common.error', 'An error occurred'),
      );
    },
  });

  const toggleTarget = (pid: string) => {
    if (pid === sourcePlatform) return;
    if (targetPlatforms.includes(pid)) {
      setTargetPlatforms(targetPlatforms.filter((p) => p !== pid));
    } else {
      setTargetPlatforms([...targetPlatforms, pid]);
    }
  };

  const handleGenerate = () => {
    if (!content.trim()) {
      toast.error(t('repurpose.contentRequired', 'Please paste your original content'));
      return;
    }
    if (targetPlatforms.length === 0) {
      toast.error(t('repurpose.targetRequired', 'Please select at least one target platform'));
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <RefreshCw size={22} />
          </div>
          {t('repurpose.title', 'Content Repurposer')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t(
            'repurpose.subtitle',
            'Adapt your content for multiple platforms in one click',
          )}
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <div className="space-y-5">
          <TextArea
            label={t('repurpose.contentLabel', 'Original content')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t(
              'repurpose.contentPlaceholder',
              'Paste your original post content here...',
            )}
            rows={6}
            disabled={mutation.isPending}
          />

          {/* Source platform */}
          <Select
            label={t('repurpose.source', 'Source platform')}
            options={platformOptions}
            value={sourcePlatform}
            onChange={(e) => {
              setSourcePlatform(e.target.value);
              setTargetPlatforms(targetPlatforms.filter((p) => p !== e.target.value));
            }}
          />

          {/* Target platforms */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('repurpose.targets', 'Target platforms')}
            </label>
            <div className="flex flex-wrap gap-2">
              {platformIds.map((pid) => {
                const platform = PLATFORMS[pid];
                const Icon = platformIcons[pid];
                const isSource = pid === sourcePlatform;
                const isSelected = targetPlatforms.includes(pid);

                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => toggleTarget(pid)}
                    disabled={isSource}
                    className={clsx(
                      'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150',
                      isSource
                        ? 'opacity-30 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                        : isSelected
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800',
                    )}
                    style={
                      isSelected && !isSource
                        ? { backgroundColor: platform.color }
                        : undefined
                    }
                  >
                    <Icon size={16} />
                    <span>{platform.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ToneSelector selected={tone} onChange={setTone} />

          <LLMSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleGenerate}
              loading={mutation.isPending}
              icon={<RefreshCw size={18} />}
              size="lg"
              disabled={!content.trim() || targetPlatforms.length === 0}
            >
              {mutation.isPending
                ? t('repurpose.repurposing', 'Repurposing...')
                : t('repurpose.repurpose', 'Repurpose Content')}
            </Button>
            {targetPlatforms.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <ArrowRight size={14} />
                {targetPlatforms.length}{' '}
                {t('repurpose.platformsSelected', 'platforms selected')}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('repurpose.adapting', 'Adapting your content for each platform...')}
          </p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !mutation.isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('repurpose.results', 'Repurposed Content')}
            </h3>
            <Badge variant="success" dot>
              {results.length} {t('repurpose.versions', 'versions')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((item) => (
              <RepurposedCard key={item.platform} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
