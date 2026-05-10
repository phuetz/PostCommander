import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Video, Sparkles, Copy, Clock, Music, Eye, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { LLMSelector } from '@/components/post/LLMSelector';
import { ToneSelector } from '@/components/post/ToneSelector';
import { generateVideoScript, type VideoScriptResult } from '@/services/api';
import type { ToneId, LLMProviderId } from '@postcommander/shared';
import toast from 'react-hot-toast';

export function VideoScriptPage() {
  const { t } = useTranslation();

  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'tiktok' | 'reels' | 'shorts'>('tiktok');
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('short');
  const [tone, setTone] = useState<ToneId>('professional');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VideoScriptResult | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error(t('videoScript.errorTopic', 'Please enter a topic'));
      return;
    }
    if (!provider || !model) {
      toast.error(t('videoScript.errorModel', 'Please select an AI model'));
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const script = await generateVideoScript({
        topic,
        platform,
        duration,
        tone,
        provider,
        model,
      });
      setResult(script);
      toast.success(t('videoScript.success', 'Script generated successfully!'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied', 'Copied to clipboard'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
          <MonitorPlay size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('videoScript.title', 'Video Script Generator')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('videoScript.subtitle', 'Create viral scripts for TikTok, Reels, and Shorts')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('videoScript.topic', 'Topic / Idea')}
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('videoScript.topicPlaceholder', 'e.g. 3 tools for productivity')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('videoScript.platform', 'Platform')}
              </label>
              <Select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                options={[
                  { value: 'tiktok', label: 'TikTok' },
                  { value: 'reels', label: 'Instagram Reels' },
                  { value: 'shorts', label: 'YouTube Shorts' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('videoScript.duration', 'Duration')}
              </label>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value as any)}
                options={[
                  { value: 'short', label: 'Short (15-30s)' },
                  { value: 'medium', label: 'Medium (30-60s)' },
                  { value: 'long', label: 'Long (1-3m)' },
                ]}
              />
            </div>

            <ToneSelector selected={tone} onChange={setTone} />

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('videoScript.aiModel', 'AI Model')}
              </label>
              <LLMSelector
                provider={provider}
                model={model}
                onProviderChange={setProvider}
                onModelChange={setModel}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={loading || !topic}
              icon={loading ? <Spinner size="sm" /> : <Sparkles size={18} />}
            >
              {loading
                ? t('common.generating', 'Generating...')
                : t('videoScript.generate', 'Generate Script')}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {result.title}
                  </h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                    icon={<Copy size={14} />}
                  >
                    Copy All
                  </Button>
                </div>
                <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-lg border border-brand-100 dark:border-brand-900/50">
                  <h3 className="text-sm font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider mb-1">
                    {t('videoScript.hook', 'The Hook')}
                  </h3>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">{result.hook}</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Video size={18} /> {t('videoScript.script', 'Script & Visuals')}
                </h3>

                <div className="space-y-4">
                  {result.parts.map((part, index) => (
                    <div
                      key={index}
                      className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="hidden sm:flex flex-col items-center justify-start text-gray-400 mt-1">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-sm shadow-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Clock size={12} /> {part.duration}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            <Eye size={12} /> {part.visual}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            <Music size={12} /> {part.audio}
                          </span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 text-lg">"{part.script}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                      {t('videoScript.cta', 'Call to Action')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300">{result.cta}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                      {t('videoScript.caption', 'Caption & Hashtags')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{result.caption}</p>
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((tag) => (
                        <span key={tag} className="text-brand-600 dark:text-brand-400 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/30">
              <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center mb-4">
                <MonitorPlay size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('videoScript.emptyTitle', 'Ready to go viral?')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                {t(
                  'videoScript.emptyDesc',
                  'Enter a topic, select your platform, and let AI generate a fully structured video script for you.',
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
