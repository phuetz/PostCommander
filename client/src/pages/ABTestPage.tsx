import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
  FlaskConical,
  Copy,
  Check,
  Trophy,
  BarChart3,
  Hash,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { LLMProviderId, ToneId } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ToneSelector } from '@/components/post/ToneSelector';
import { LLMSelector } from '@/components/post/LLMSelector';
import { generateABTest, type ABVariant } from '@/services/api';

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },
];

const variantCountOptions = [
  { value: '2', label: '2 variants' },
  { value: '3', label: '3 variants' },
  { value: '4', label: '4 variants' },
  { value: '5', label: '5 variants' },
];

function calculateEngagementScore(content: string): number {
  let score = 50;

  // Hook strength: first line matters
  const firstLine = content.split('\n')[0] || '';
  if (firstLine.length > 10 && firstLine.length < 100) score += 5;
  if (firstLine.includes('?')) score += 5;
  if (/^\d/.test(firstLine) || /\d+/.test(firstLine)) score += 3;

  // Length optimization
  const len = content.length;
  if (len >= 100 && len <= 2000) score += 5;
  if (len >= 200 && len <= 1500) score += 5;

  // Hashtags
  const hashtags = (content.match(/#\w+/g) || []).length;
  if (hashtags >= 1 && hashtags <= 5) score += 5;
  if (hashtags > 5 && hashtags <= 15) score += 3;

  // Questions for engagement
  const questions = (content.match(/\?/g) || []).length;
  if (questions >= 1) score += 4;
  if (questions >= 2) score += 2;

  // Line breaks for readability
  const lineBreaks = (content.match(/\n/g) || []).length;
  if (lineBreaks >= 2) score += 4;
  if (lineBreaks >= 4) score += 3;

  // Call to action keywords
  const ctaPatterns = /\b(comment|share|follow|like|save|repost|tag|dm|link|click|subscribe)\b/i;
  if (ctaPatterns.test(content)) score += 5;

  // Emojis
  const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount >= 1 && emojiCount <= 5) score += 3;

  return Math.min(100, Math.max(0, score));
}

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-green-500'
      : score >= 60
        ? 'text-amber-500'
        : 'text-red-400';
  const bgColor =
    score >= 80
      ? 'bg-green-50 dark:bg-green-900/20'
      : score >= 60
        ? 'bg-amber-50 dark:bg-amber-900/20'
        : 'bg-red-50 dark:bg-red-900/20';

  return (
    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${bgColor}`}>
      <span className={`text-sm font-bold ${color}`}>{score}</span>
    </div>
  );
}

function VariantCard({
  variant,
  index,
  isWinner,
  onPickWinner,
}: {
  variant: ABVariant;
  index: number;
  isWinner: boolean;
  onPickWinner: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const engagementScore = calculateEngagementScore(variant.content);
  const charCount = variant.content.length;
  const hashtagCount = (variant.content.match(/#\w+/g) || []).length;
  const questionCount = (variant.content.match(/\?/g) || []).length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(variant.content);
    setCopied(true);
    toast.success(t('post.copied', 'Copied!'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      hover
      className={clsx(
        'relative transition-all duration-200',
        isWinner && 'ring-2 ring-green-500 border-green-300 dark:border-green-700',
      )}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold">
              {String.fromCharCode(65 + index)}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {variant.angle}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {variant.hookStyle}
              </p>
            </div>
          </div>
          <ScoreCircle score={engagementScore} />
        </div>

        {/* Content */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
            {variant.content}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <BarChart3 size={12} />
            {charCount} {t('abtest.chars', 'chars')}
          </span>
          <span className="flex items-center gap-1">
            <Hash size={12} />
            {hashtagCount} {t('abtest.hashtags', 'hashtags')}
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle size={12} />
            {questionCount} {t('abtest.questions', 'questions')}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {t('abtest.score', 'Score')}: {engagementScore}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleCopy}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              copied
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
            )}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? t('post.copied', 'Copied!') : t('post.copy', 'Copy')}
          </button>
          <button
            onClick={onPickWinner}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              isWinner
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 ring-1 ring-green-500/30'
                : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50',
            )}
          >
            <Trophy size={12} />
            {isWinner
              ? t('abtest.winner', 'Winner!')
              : t('abtest.pickWinner', 'Pick Winner')}
          </button>
        </div>

        {/* Winner badge */}
        {isWinner && (
          <div className="absolute -top-2 -right-2">
            <Badge variant="success" dot>
              {t('abtest.winner', 'Winner!')}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}

export function ABTestPage() {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [tone, setTone] = useState<ToneId>('professional');
  const [variantCount, setVariantCount] = useState('3');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [variants, setVariants] = useState<ABVariant[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      generateABTest({
        prompt,
        platform,
        tone,
        provider,
        model,
        variantCount: parseInt(variantCount),
      }),
    onSuccess: (data) => {
      setVariants(data.variants);
      setWinnerId(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t('common.error', 'An error occurred'),
      );
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error(t('abtest.promptRequired', 'Please enter a topic or idea'));
      return;
    }
    mutation.mutate();
  };

  const handlePickWinner = (variantId: string) => {
    setWinnerId(variantId);
    toast.success(t('abtest.winnerSelected', 'Winner selected!'));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <FlaskConical size={22} />
          </div>
          {t('abtest.title', 'A/B Testing')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t(
            'abtest.subtitle',
            'Generate and compare multiple post variants to find the best performer',
          )}
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <div className="space-y-5">
          <TextArea
            label={t('abtest.topicLabel', 'Topic or idea')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t(
              'abtest.topicPlaceholder',
              'e.g., "Share the benefits of remote work for productivity"',
            )}
            rows={3}
            disabled={mutation.isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('abtest.platform', 'Platform')}
              options={platformOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
            <Select
              label={t('abtest.variantCount', 'Number of variants')}
              options={variantCountOptions}
              value={variantCount}
              onChange={(e) => setVariantCount(e.target.value)}
            />
          </div>

          <ToneSelector selected={tone} onChange={setTone} />

          <LLMSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />

          <div className="pt-2">
            <Button
              onClick={handleGenerate}
              loading={mutation.isPending}
              icon={<FlaskConical size={18} />}
              size="lg"
              disabled={!prompt.trim()}
            >
              {mutation.isPending
                ? t('abtest.generating', 'Generating variants...')
                : t('abtest.generate', 'Generate A/B Variants')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('abtest.crafting', 'Crafting unique variant angles...')}
          </p>
        </div>
      )}

      {/* Results */}
      {variants.length > 0 && !mutation.isPending && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('abtest.results', 'Variant Comparison')}
            </h3>
            <Badge variant="info" dot>
              {variants.length} {t('abtest.variants', 'variants')}
            </Badge>
          </div>

          <div className={clsx(
            'grid gap-5',
            variants.length <= 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
          )}>
            {variants.map((variant, index) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                index={index}
                isWinner={winnerId === variant.id}
                onPickWinner={() => handlePickWinner(variant.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
