import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Hash, Copy, Check, TrendingUp, Flame, Target, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { researchHashtags, type HashtagResult } from '@/services/api';

const platformOptions = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
];

const countOptions = [5, 10, 15, 20, 25, 30].map((n) => ({
  value: String(n),
  label: `${n} hashtags`,
}));

const categoryConfig: Record<
  string,
  {
    label: string;
    badgeVariant: 'danger' | 'warning' | 'info';
    icon: React.ElementType;
    color: string;
  }
> = {
  trending: {
    label: 'Trending',
    badgeVariant: 'danger',
    icon: Flame,
    color: 'text-red-500',
  },
  popular: {
    label: 'Popular',
    badgeVariant: 'warning',
    icon: TrendingUp,
    color: 'text-amber-500',
  },
  niche: {
    label: 'Niche',
    badgeVariant: 'info',
    icon: Target,
    color: 'text-blue-500',
  },
};

function RelevanceBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const barColor =
    percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-400 w-8 text-right">{percentage}%</span>
    </div>
  );
}

export function HashtagsPage() {
  const { t } = useTranslation();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [count, setCount] = useState('15');
  const [hashtags, setHashtags] = useState<HashtagResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSelected, setCopiedSelected] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      researchHashtags({
        topic,
        platform,
        count: parseInt(count),
      }),
    onSuccess: (data) => {
      setHashtags(data);
      setSelected(new Set(data.map((h) => h.tag)));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('common.error', 'An error occurred'));
    },
  });

  const groupedHashtags = useMemo(() => {
    const groups: Record<string, HashtagResult[]> = {
      trending: [],
      popular: [],
      niche: [],
    };
    hashtags.forEach((h) => {
      if (groups[h.category]) {
        groups[h.category].push(h);
      }
    });
    return groups;
  }, [hashtags]);

  const toggleHashtag = (tag: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelected(newSelected);
  };

  const handleCopyAll = async () => {
    const text = hashtags.map((h) => `#${h.tag}`).join(' ');
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success(t('post.copied', 'Copied!'));
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySelected = async () => {
    const text = [...selected].map((tag) => `#${tag}`).join(' ');
    await navigator.clipboard.writeText(text);
    setCopiedSelected(true);
    toast.success(t('post.copied', 'Copied!'));
    setTimeout(() => setCopiedSelected(false), 2000);
  };

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error(t('hashtags.topicRequired', 'Please enter a topic'));
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <Hash size={22} />
          </div>
          {t('hashtags.title', 'Hashtag Research')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t('hashtags.subtitle', 'Find the perfect hashtags to maximize your reach')}
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <div className="space-y-5">
          <Input
            label={t('hashtags.topicLabel', 'Topic or keyword')}
            icon={<Search size={16} />}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t(
              'hashtags.topicPlaceholder',
              'e.g., artificial intelligence, startup, marketing',
            )}
            disabled={mutation.isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('hashtags.platform', 'Platform')}
              options={platformOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
            <Select
              label={t('hashtags.count', 'Number of hashtags')}
              options={countOptions}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={handleGenerate}
              loading={mutation.isPending}
              icon={<Hash size={18} />}
              size="lg"
              disabled={!topic.trim()}
            >
              {mutation.isPending
                ? t('hashtags.researching', 'Researching...')
                : t('hashtags.research', 'Research Hashtags')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('hashtags.analyzing', 'Analyzing trending hashtags...')}
          </p>
        </div>
      )}

      {/* Results */}
      {hashtags.length > 0 && !mutation.isPending && (
        <div className="space-y-5">
          {/* Action buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="success" dot>
                {selected.size} {t('hashtags.selected', 'selected')}
              </Badge>
              <span className="text-sm text-gray-400">
                / {hashtags.length} {t('hashtags.total', 'total')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={copiedSelected ? <Check size={14} /> : <Copy size={14} />}
                onClick={handleCopySelected}
                disabled={selected.size === 0}
              >
                {copiedSelected
                  ? t('post.copied', 'Copied!')
                  : t('hashtags.copySelected', 'Copy Selected')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={copiedAll ? <Check size={14} /> : <Copy size={14} />}
                onClick={handleCopyAll}
              >
                {copiedAll ? t('post.copied', 'Copied!') : t('hashtags.copyAll', 'Copy All')}
              </Button>
            </div>
          </div>

          {/* Grouped hashtags */}
          {Object.entries(groupedHashtags).map(([category, tags]) => {
            if (tags.length === 0) return null;
            const config = categoryConfig[category];
            const CategoryIcon = config.icon;

            return (
              <Card key={category}>
                <div className="space-y-4">
                  {/* Category header */}
                  <div className="flex items-center gap-2">
                    <CategoryIcon size={18} className={config.color} />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {t(`hashtags.${category}`, config.label)}
                    </h3>
                    <Badge variant={config.badgeVariant}>{tags.length}</Badge>
                  </div>

                  {/* Hashtag list */}
                  <div className="space-y-2">
                    {tags
                      .sort((a, b) => b.relevanceScore - a.relevanceScore)
                      .map((hashtag) => {
                        const isSelected = selected.has(hashtag.tag);

                        return (
                          <button
                            key={hashtag.tag}
                            onClick={() => toggleHashtag(hashtag.tag)}
                            className={clsx(
                              'flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-left transition-all duration-200',
                              isSelected
                                ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 ring-1 ring-brand-500/20'
                                : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
                            )}
                          >
                            {/* Checkbox indicator */}
                            <div
                              className={clsx(
                                'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                isSelected
                                  ? 'bg-brand-600 border-brand-600'
                                  : 'border-gray-300 dark:border-gray-600',
                              )}
                            >
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>

                            {/* Tag name */}
                            <span
                              className={clsx(
                                'font-medium text-sm min-w-[120px]',
                                isSelected
                                  ? 'text-brand-700 dark:text-brand-300'
                                  : 'text-gray-700 dark:text-gray-300',
                              )}
                            >
                              #{hashtag.tag}
                            </span>

                            {/* Relevance bar */}
                            <RelevanceBar score={hashtag.relevanceScore} />

                            {/* Category badge */}
                            <Badge variant={config.badgeVariant} className="flex-shrink-0">
                              {config.label}
                            </Badge>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Preview of selected */}
          {selected.size > 0 && (
            <Card>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('hashtags.preview', 'Selected Hashtags Preview')}
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-brand-600 dark:text-brand-400 break-words">
                    {[...selected].map((tag) => `#${tag}`).join(' ')}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
