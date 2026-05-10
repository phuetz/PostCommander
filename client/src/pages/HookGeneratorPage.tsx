import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Zap, Copy, Check, ArrowRight, Lightbulb, Target, TrendingUp, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import type { LLMProviderId, ToneId } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ToneSelector } from '@/components/post/ToneSelector';
import { LLMSelector } from '@/components/post/LLMSelector';
import { generateHooks, type GeneratedHook } from '@/services/api';

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

const hookCountOptions = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 3),
  label: `${i + 3} hooks`,
}));

const traitIcons: Record<string, React.ElementType> = {
  curiosity: Lightbulb,
  numbers: Hash,
  controversy: Target,
  trending: TrendingUp,
};

function ScoreBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8 text-right">
        {percentage}%
      </span>
    </div>
  );
}

function HookCard({
  hook,
  index,
  onUse,
}: {
  hook: GeneratedHook;
  index: number;
  onUse: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hook.text);
    setCopied(true);
    toast.success(t('post.copied', 'Copied!'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card hover className="group">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold">
            {index + 1}
          </span>
          <ScoreBar score={hook.score} />
        </div>

        {/* Hook Text */}
        <p className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed text-base">
          {hook.text}
        </p>

        {/* Traits */}
        <div className="flex flex-wrap gap-1.5">
          {hook.traits.map((trait) => {
            const TraitIcon = traitIcons[trait] || Lightbulb;
            return (
              <Badge key={trait} variant="info">
                <span className="flex items-center gap-1">
                  <TraitIcon size={10} />
                  {trait}
                </span>
              </Badge>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              copied
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? t('post.copied', 'Copied!') : t('post.copy', 'Copy')}
          </button>
          <button
            onClick={onUse}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all"
          >
            <ArrowRight size={12} />
            {t('hooks.useHook', 'Use this hook')}
          </button>
        </div>
      </div>
    </Card>
  );
}

export function HookGeneratorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [tone, setTone] = useState<ToneId>('professional');
  const [hookCount, setHookCount] = useState('5');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [hooks, setHooks] = useState<GeneratedHook[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      generateHooks({
        topic,
        platform,
        tone,
        count: parseInt(hookCount),
        provider,
        model,
      }),
    onSuccess: (data) => {
      setHooks(data);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.error', 'An error occurred'));
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error(t('hooks.topicRequired', 'Please enter a topic'));
      return;
    }
    mutation.mutate();
  };

  const handleUseHook = (hookText: string) => {
    navigate('/app/generate', { state: { prompt: hookText } });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Zap size={22} />
          </div>
          {t('hooks.title', 'Hook Generator')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t('hooks.subtitle', 'Generate attention-grabbing opening lines that stop the scroll')}
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <div className="space-y-5">
          <TextArea
            label={t('hooks.topicLabel', 'Topic or subject')}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t(
              'hooks.topicPlaceholder',
              'e.g., "How I grew my startup from 0 to 10K users in 3 months"',
            )}
            rows={3}
            disabled={mutation.isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('hooks.platform', 'Platform')}
              options={platformOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
            <Select
              label={t('hooks.hookCount', 'Number of hooks')}
              options={hookCountOptions}
              value={hookCount}
              onChange={(e) => setHookCount(e.target.value)}
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
              icon={<Zap size={18} />}
              size="lg"
              disabled={!topic.trim()}
            >
              {mutation.isPending
                ? t('hooks.generating', 'Generating hooks...')
                : t('hooks.generate', 'Generate Hooks')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('hooks.craftingHooks', 'Crafting attention-grabbing hooks...')}
          </p>
        </div>
      )}

      {/* Results */}
      {hooks.length > 0 && !mutation.isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('hooks.results', 'Generated Hooks')}
            </h3>
            <Badge variant="success" dot>
              {hooks.length} {t('hooks.hooksGenerated', 'hooks')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {hooks.map((hook, index) => (
              <HookCard
                key={index}
                hook={hook}
                index={index}
                onUse={() => handleUseHook(hook.text)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
