import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  PlatformId,
  ToneId,
  LLMProviderId,
  GenerateRequest,
} from '@postcommander/shared';
import { useGenerate } from '@/hooks/useGenerate';
import { createPost } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PlatformSelector } from './PlatformSelector';
import { ToneSelector } from './ToneSelector';
import { LLMSelector } from './LLMSelector';
import { PostPreview } from './PostPreview';

export function PostGenerator() {
  const { t } = useTranslation();
  const {
    isGenerating,
    streamedContent,
    result,
    error,
    generate,
    cancel,
    reset,
  } = useGenerate();

  const [prompt, setPrompt] = useState('');
  const [platforms, setPlatforms] = useState<PlatformId[]>(['linkedin']);
  const [tone, setTone] = useState<ToneId>('professional');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [enableAutoPlug, setEnableAutoPlug] = useState(false);
  const [autoPlugContent, setAutoPlugContent] = useState('');
  const [autoPlugThreshold, setAutoPlugThreshold] = useState('50');

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error(t('generate.promptRequired', 'Please enter a topic or idea'));
      return;
    }
    if (platforms.length === 0) {
      toast.error(
        t('generate.platformRequired', 'Please select at least one platform'),
      );
      return;
    }

    const request: GenerateRequest = {
      prompt: prompt.trim(),
      platforms,
      tone,
      provider,
      model,
      language: 'fr',
    };

    generate(request, true);
  };

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      await createPost({
        content: result.content,
        originalPrompt: prompt,
        tone,
        llmProvider: provider,
        llmModel: model,
        platforms,
        platformVariants:
          Object.keys(variants).length > 0 ? variants : result.platformVariants,
        hashtags: result.hashtags,
        autoPlugContent: enableAutoPlug && autoPlugContent ? autoPlugContent : undefined,
        autoPlugThreshold: enableAutoPlug && autoPlugThreshold ? parseInt(autoPlugThreshold, 10) : undefined,
        status: 'draft',
        scheduledAt: null,
        publishedAt: null,
      });
      toast.success(t('generate.saved', 'Post saved as draft'));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('common.error', 'An error occurred'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleVariantChange = (platform: string, content: string) => {
    setVariants((prev) => ({ ...prev, [platform]: content }));
  };

  const handleReset = () => {
    reset();
    setVariants({});
  };

  const currentVariants =
    Object.keys(variants).length > 0
      ? { ...(result?.platformVariants || {}), ...variants }
      : result?.platformVariants || {};

  const hasResult = result !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Prompt Input */}
      <Card>
        <div className="space-y-5">
          <TextArea
            label={t('generate.promptLabel', 'What do you want to post about?')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t(
              'generate.promptPlaceholder',
              'Describe your topic, idea, or paste content to adapt...',
            )}
            rows={4}
            disabled={isGenerating}
          />

          <PlatformSelector selected={platforms} onChange={setPlatforms} />

          <ToneSelector selected={tone} onChange={setTone} />

          <LLMSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />

          {/* Auto-Plug Configuration */}
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAutoPlug}
                onChange={(e) => setEnableAutoPlug(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('generate.enableAutoPlug', 'Enable Dynamic Auto-Plug (Growth Feature)')}
              </span>
            </label>

            {enableAutoPlug && (
              <div className="pl-6 space-y-3">
                <TextArea
                  label={t('generate.autoPlugContent', 'Auto-Plug Comment Content')}
                  value={autoPlugContent}
                  onChange={(e) => setAutoPlugContent(e.target.value)}
                  placeholder={t('generate.autoPlugContentPlaceholder', 'e.g. Thanks for reading! Subscribe to my newsletter here: https://...')}
                  rows={2}
                />
                <Input
                  label={t('generate.autoPlugThreshold', 'Viral Threshold (Likes)')}
                  type="number"
                  min="1"
                  value={autoPlugThreshold}
                  onChange={(e) => setAutoPlugThreshold(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleGenerate}
              loading={isGenerating}
              icon={<Sparkles size={18} />}
              size="lg"
              disabled={!prompt.trim() || platforms.length === 0}
            >
              {isGenerating
                ? t('generate.generating', 'Generating...')
                : t('generate.button', 'Generate Post')}
            </Button>

            {isGenerating && (
              <Button
                variant="ghost"
                onClick={cancel}
                icon={<X size={18} />}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
            )}

            {hasResult && !isGenerating && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  loading={isSaving}
                  icon={<Save size={18} />}
                >
                  {t('generate.saveDraft', 'Save as Draft')}
                </Button>
                <Button variant="ghost" onClick={handleReset}>
                  {t('generate.reset', 'Reset')}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Streaming / Result Preview */}
      {(isGenerating || hasResult) && (
        <PostPreview
          platforms={platforms}
          platformVariants={currentVariants}
          onVariantChange={hasResult ? handleVariantChange : undefined}
          streaming={isGenerating}
          streamedContent={streamedContent}
        />
      )}

      {/* Hashtags */}
      {result?.hashtags && result.hashtags.length > 0 && (
        <Card>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('generate.hashtags', 'Suggested Hashtags')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
