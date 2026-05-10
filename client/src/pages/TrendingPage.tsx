import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight, Flame, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { LLMProviderId } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { LLMSelector } from '@/components/post/LLMSelector';
import { getTrendingTopics, type TrendingTopic } from '@/services/api';

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },
];

const industryOptions = [
  { value: 'tech', label: 'Technology' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'business', label: 'Business' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'ai', label: 'Artificial Intelligence' },
  { value: 'saas', label: 'SaaS / Startups' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'sustainability', label: 'Sustainability' },
  { value: 'design', label: 'Design & Creative' },
];

const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
];

function TrendScoreBadge({ score }: { score: number }) {
  const variant = score >= 80 ? 'danger' : score >= 60 ? 'warning' : 'info';
  const label = score >= 80 ? 'Hot' : score >= 60 ? 'Rising' : 'Emerging';

  return (
    <Badge variant={variant} dot>
      <span className="flex items-center gap-1">
        {score >= 80 && <Flame size={10} />}
        {score}% {label}
      </span>
    </Badge>
  );
}

function TopicCard({
  topic,
  onGeneratePost,
}: {
  topic: TrendingTopic;
  onGeneratePost: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Card hover className="group">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
            {topic.title}
          </h4>
          <TrendScoreBadge score={topic.trendScore} />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {topic.description}
        </p>

        {/* Suggested Angles */}
        {topic.suggestedAngles.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t('trending.suggestedAngles', 'Suggested Angles')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topic.suggestedAngles.map((angle, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {angle}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onGeneratePost}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all"
          >
            <Sparkles size={12} />
            {t('trending.generatePost', 'Generate Post')}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </Card>
  );
}

export function TrendingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState('linkedin');
  const [industry, setIndustry] = useState('tech');
  const [language, setLanguage] = useState('English');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      getTrendingTopics({
        platform,
        industry,
        language,
        provider,
        model,
      }),
    onSuccess: (data) => {
      setTopics(data.topics);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.error', 'An error occurred'));
    },
  });

  const handleFindTrends = () => {
    mutation.mutate();
  };

  const handleGeneratePost = (topic: TrendingTopic) => {
    const angles =
      topic.suggestedAngles.length > 0
        ? `\n\nSuggested angles: ${topic.suggestedAngles.join(', ')}`
        : '';
    navigate('/app/generate', {
      state: {
        prompt: `${topic.title}: ${topic.description}${angles}`,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
            <TrendingUp size={22} />
          </div>
          {t('trending.title', 'Trending Topics')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t(
            'trending.subtitle',
            'Discover trending topics in your industry and create content that resonates',
          )}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label={t('trending.platform', 'Platform')}
              options={platformOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
            <Select
              label={t('trending.industry', 'Industry')}
              options={industryOptions}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
            <Select
              label={t('trending.language', 'Language')}
              options={languageOptions}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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
              onClick={handleFindTrends}
              loading={mutation.isPending}
              icon={<TrendingUp size={18} />}
              size="lg"
            >
              {mutation.isPending
                ? t('trending.finding', 'Finding trends...')
                : t('trending.findTrends', 'Find Trends')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('trending.analyzing', 'Analyzing trending conversations...')}
          </p>
        </div>
      )}

      {/* Results */}
      {topics.length > 0 && !mutation.isPending && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('trending.results', 'Trending Now')}
            </h3>
            <Badge variant="success" dot>
              {topics.length} {t('trending.topicsFound', 'topics')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {topics.map((topic, index) => (
              <TopicCard
                key={index}
                topic={topic}
                onGeneratePost={() => handleGeneratePost(topic)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
