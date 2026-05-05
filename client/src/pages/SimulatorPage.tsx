import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
  Activity,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import type { LLMProviderId } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { LLMSelector } from '@/components/post/LLMSelector';
import { simulatePerformance, type SimulateResult, type PerformanceRange } from '@/services/api';

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },
];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function MetricCard({
  icon: Icon,
  label,
  range,
  iconColor,
  bgColor,
  isPercentage = false,
}: {
  icon: React.ElementType;
  label: string;
  range: PerformanceRange;
  iconColor: string;
  bgColor: string;
  isPercentage?: boolean;
}) {
  const lowFormatted = isPercentage ? `${range.low}%` : formatNumber(range.low);
  const highFormatted = isPercentage ? `${range.high}%` : formatNumber(range.high);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={clsx('flex items-center justify-center w-8 h-8 rounded-lg', bgColor)}>
          <Icon size={16} className={iconColor} />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {lowFormatted}
        </span>
        <span className="text-sm text-gray-400">-</span>
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {highFormatted}
        </span>
      </div>
      {/* Range visualization */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={clsx('absolute h-full rounded-full', iconColor.replace('text-', 'bg-'))}
          style={{
            left: `${Math.min(range.low / (range.high * 1.5) * 100, 100)}%`,
            width: `${Math.min((range.high - range.low) / (range.high * 1.5) * 100, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

export function SimulatorPage() {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [audience, setAudience] = useState('');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [result, setResult] = useState<SimulateResult | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      simulatePerformance({
        content,
        platform,
        audience: audience || undefined,
        provider,
        model,
      }),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t('common.error', 'An error occurred'),
      );
    },
  });

  const handleSimulate = () => {
    if (!content.trim()) {
      toast.error(t('simulator.contentRequired', 'Please enter post content'));
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <Activity size={22} />
          </div>
          {t('simulator.title', 'Performance Simulator')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t(
            'simulator.subtitle',
            'Predict how your post will perform before publishing',
          )}
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <div className="space-y-5">
          <TextArea
            label={t('simulator.contentLabel', 'Post content')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t(
              'simulator.contentPlaceholder',
              'Paste your post content to simulate its performance...',
            )}
            rows={6}
            disabled={mutation.isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('simulator.platform', 'Platform')}
              options={platformOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
            <Input
              label={t('simulator.audience', 'Target Audience (optional)')}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder={t(
                'simulator.audiencePlaceholder',
                'e.g., B2B tech professionals, 5K followers',
              )}
            />
          </div>

          <LLMSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />

          <div className="pt-2">
            <Button
              onClick={handleSimulate}
              loading={mutation.isPending}
              icon={<Activity size={18} />}
              size="lg"
              disabled={!content.trim()}
            >
              {mutation.isPending
                ? t('simulator.simulating', 'Simulating...')
                : t('simulator.simulate', 'Simulate Performance')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('simulator.analyzing', 'Running performance simulation...')}
          </p>
        </div>
      )}

      {/* Results */}
      {result && !mutation.isPending && (
        <div className="space-y-5">
          {/* Summary */}
          <Card>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <TrendingUp size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {t('simulator.predictionSummary', 'Prediction Summary')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {result.summary}
                </p>
              </div>
            </div>
          </Card>

          {/* Metrics Grid */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('simulator.predictedMetrics', 'Predicted Metrics')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard
                  icon={Eye}
                  label={t('simulator.impressions', 'Impressions')}
                  range={result.impressions}
                  iconColor="text-blue-500"
                  bgColor="bg-blue-50 dark:bg-blue-900/30"
                />
                <MetricCard
                  icon={ThumbsUp}
                  label={t('simulator.likes', 'Likes')}
                  range={result.likes}
                  iconColor="text-pink-500"
                  bgColor="bg-pink-50 dark:bg-pink-900/30"
                />
                <MetricCard
                  icon={MessageCircle}
                  label={t('simulator.comments', 'Comments')}
                  range={result.comments}
                  iconColor="text-amber-500"
                  bgColor="bg-amber-50 dark:bg-amber-900/30"
                />
                <MetricCard
                  icon={Share2}
                  label={t('simulator.shares', 'Shares')}
                  range={result.shares}
                  iconColor="text-green-500"
                  bgColor="bg-green-50 dark:bg-green-900/30"
                />
                <MetricCard
                  icon={TrendingUp}
                  label={t('simulator.engagementRate', 'Engagement Rate')}
                  range={result.engagementRate}
                  iconColor="text-violet-500"
                  bgColor="bg-violet-50 dark:bg-violet-900/30"
                  isPercentage
                />
              </div>
            </div>
          </Card>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-amber-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {t('simulator.recommendations', 'Recommendations')}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
