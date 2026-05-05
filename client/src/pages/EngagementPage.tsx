import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Gauge,
  Lightbulb,
  Sparkles,
  BookOpen,
  Heart,
  MousePointerClick,
  Hash,
  Ruler,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { LLMProviderId } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { LLMSelector } from '@/components/post/LLMSelector';
import { analyzeEngagement, type EngagementResult } from '@/services/api';

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },
];

const metricConfig: Record<
  string,
  { label: string; icon: React.ElementType; description: string }
> = {
  hookStrength: {
    label: 'Hook Strength',
    icon: Zap,
    description: 'How attention-grabbing is the opening?',
  },
  readability: {
    label: 'Readability',
    icon: BookOpen,
    description: 'How easy is it to read and scan?',
  },
  emotionalAppeal: {
    label: 'Emotional Appeal',
    icon: Heart,
    description: 'Does it evoke emotions or connection?',
  },
  callToAction: {
    label: 'Call to Action',
    icon: MousePointerClick,
    description: 'Does it encourage engagement?',
  },
  hashtagRelevance: {
    label: 'Hashtag Relevance',
    icon: Hash,
    description: 'Are hashtags present and relevant?',
  },
  lengthOptimization: {
    label: 'Length Optimization',
    icon: Ruler,
    description: 'Is the length optimal for the platform?',
  },
};

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? '#22c55e'
      : score >= 60
        ? '#f59e0b'
        : score >= 40
          ? '#f97316'
          : '#ef4444';

  const label =
    score >= 80
      ? 'Excellent'
      : score >= 60
        ? 'Good'
        : score >= 40
          ? 'Fair'
          : 'Needs Work';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{score}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
    </div>
  );
}

function MetricBar({ label, score, icon: Icon, description }: {
  label: string;
  score: number;
  icon: React.ElementType;
  description: string;
}) {
  const color =
    score >= 80
      ? 'bg-green-500'
      : score >= 60
        ? 'bg-amber-500'
        : score >= 40
          ? 'bg-orange-500'
          : 'bg-red-500';

  const textColor =
    score >= 80
      ? 'text-green-600 dark:text-green-400'
      : score >= 60
        ? 'text-amber-600 dark:text-amber-400'
        : score >= 40
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
    </div>
  );
}

import { MessageCircle } from 'lucide-react';
import { CommunityTab } from '@/components/analytics/CommunityTab';

export function EngagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'predictor' | 'community'>('predictor');
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [result, setResult] = useState<EngagementResult | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      analyzeEngagement({
        content,
        platform,
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

  const handleAnalyze = () => {
    if (!content.trim()) {
      toast.error(t('engagement.contentRequired', 'Please enter post content'));
      return;
    }
    mutation.mutate();
  };

  const handleImproveWithAI = () => {
    const suggestionText = result?.suggestions.join('. ') || '';
    navigate('/app/generate', {
      state: {
        prompt: `Improve the following post based on these suggestions: ${suggestionText}\n\nOriginal post:\n${content}`,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <Gauge size={22} />
          </div>
          {t('engagement.title', 'Engagement & Community')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t(
            'engagement.subtitle',
            'Predict engagement potential and manage community interactions with AI.',
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('predictor')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'predictor'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
          }`}
        >
          <Gauge size={18} />
          Predictor
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'community'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
          }`}
        >
          <MessageCircle size={18} />
          Community
        </button>
      </div>

      {activeTab === 'predictor' ? (
        <div className="space-y-6">

      {/* Input Form */}
      <Card>
        <div className="space-y-5">
          <TextArea
            label={t('engagement.contentLabel', 'Post content')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t(
              'engagement.contentPlaceholder',
              'Paste or write your post content here...',
            )}
            rows={6}
            disabled={mutation.isPending}
          />

          <Select
            label={t('engagement.platform', 'Platform')}
            options={platformOptions}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />

          <LLMSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />

          <div className="pt-2">
            <Button
              onClick={handleAnalyze}
              loading={mutation.isPending}
              icon={<Gauge size={18} />}
              size="lg"
              disabled={!content.trim()}
            >
              {mutation.isPending
                ? t('engagement.analyzing', 'Analyzing...')
                : t('engagement.analyze', 'Analyze Engagement')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('engagement.predicting', 'Analyzing engagement potential...')}
          </p>
        </div>
      )}

      {/* Results */}
      {result && !mutation.isPending && (
        <div className="space-y-5">
          {/* Overall Score */}
          <Card>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={result.overallScore} />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('engagement.overallScore', 'Overall Engagement Score')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {result.overallScore >= 80
                    ? t('engagement.scoreExcellent', 'Your post has excellent engagement potential! It should perform well.')
                    : result.overallScore >= 60
                      ? t('engagement.scoreGood', 'Good engagement potential with room for improvement.')
                      : result.overallScore >= 40
                        ? t('engagement.scoreFair', 'Fair engagement potential. Consider applying the suggestions below.')
                        : t('engagement.scoreNeedsWork', 'This post needs improvement. Check the suggestions below for actionable tips.')}
                </p>
              </div>
            </div>
          </Card>

          {/* Metric Breakdown */}
          <Card>
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('engagement.breakdown', 'Score Breakdown')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Object.entries(metricConfig).map(([key, config]) => (
                  <MetricBar
                    key={key}
                    label={t(`engagement.${key}`, config.label)}
                    score={result.breakdown[key as keyof typeof result.breakdown]}
                    icon={config.icon}
                    description={t(`engagement.${key}Desc`, config.description)}
                  />
                ))}
              </div>
            </div>
          </Card>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-amber-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {t('engagement.suggestions', 'Improvement Suggestions')}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {result.suggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    onClick={handleImproveWithAI}
                    variant="secondary"
                    icon={<Sparkles size={16} />}
                  >
                    {t('engagement.improveWithAI', 'Improve with AI')}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
      </div>
      ) : (
        <CommunityTab />
      )}
    </div>
  );
}
