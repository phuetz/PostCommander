import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { PlatformId, ToneId, LLMProviderId, GenerateRequest } from '@postcommander/shared';
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
  const { isGenerating, streamedContent, agentStatus, result, error, generate, cancel, reset } = useGenerate();

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

  // Blog Article State
  const [isBlogArticle, setIsBlogArticle] = useState(false);
  const [articleType, setArticleType] = useState('fond-technique');
  const [authorName, setAuthorName] = useState('Patrice Huetz');
  const [authorRole, setAuthorRole] = useState('architecte logiciel');
  const [authorReferences, setAuthorReferences] = useState('La Boucle Ralph, GitNexus, Agile Up');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t('generate.promptRequired', 'Please enter a topic or idea'));
      return;
    }

    if (isBlogArticle) {
      if (!authorName.trim()) {
        toast.error("Veuillez entrer un nom d'auteur");
        return;
      }
      try {
        setIsSaving(true);
        const { generateBlogArticle } = await import('@/services/api');
        const blogResult = await generateBlogArticle({
          topic: prompt.trim(),
          articleType,
          provider,
          model,
          authorName: authorName.trim(),
          authorRole: authorRole.trim(),
          authorReferences: authorReferences
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        });

        setVariants({ linkedin: blogResult.content });
        // Create a mock result for the preview
        reset(); // clear previous
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur de génération du blog');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (platforms.length === 0) {
      toast.error(t('generate.platformRequired', 'Please select at least one platform'));
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
        platformVariants: Object.keys(variants).length > 0 ? variants : result.platformVariants,
        hashtags: result.hashtags,
        autoPlugContent: enableAutoPlug && autoPlugContent ? autoPlugContent : undefined,
        autoPlugThreshold:
          enableAutoPlug && autoPlugThreshold ? parseInt(autoPlugThreshold, 10) : undefined,
        status: 'draft',
        scheduledAt: null,
        publishedAt: null,
      });
      toast.success(t('generate.saved', 'Post saved as draft'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error', 'An error occurred'));
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

          {/* Blog Article Configuration */}
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBlogArticle}
                onChange={(e) => setIsBlogArticle(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Générer un Article de Blog (Long format)
              </span>
            </label>

            {isBlogArticle && (
              <div className="pl-6 space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type d'Article
                  </label>
                  <select
                    value={articleType}
                    onChange={(e) => setArticleType(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option value="fond-technique">
                      Fond Technique (Pédagogique, Problème/Solution)
                    </option>
                    <option value="news-comment">News Commentée (React to news)</option>
                    <option value="opinion-perso">Opinion Perso (Essai, Prise de position)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nom de l'auteur"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                  <Input
                    label="Rôle / Expertise"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                  />
                </div>

                <TextArea
                  label="Références Catalogue (séparées par des virgules)"
                  value={authorReferences}
                  onChange={(e) => setAuthorReferences(e.target.value)}
                  placeholder="Ex: La Boucle Ralph, GitNexus..."
                  rows={2}
                />
              </div>
            )}
          </div>

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
                  placeholder={t(
                    'generate.autoPlugContentPlaceholder',
                    'e.g. Thanks for reading! Subscribe to my newsletter here: https://...',
                  )}
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
              <Button variant="ghost" onClick={cancel} icon={<X size={18} />}>
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
      {(isGenerating || hasResult || Object.keys(variants).length > 0) && (
        <div className="space-y-4">
          {isGenerating && agentStatus && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg text-brand-700 dark:text-brand-400 text-sm font-medium flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              {agentStatus}
            </motion.div>
          )}
          <PostPreview
            platforms={isBlogArticle ? ['linkedin'] : platforms}
            platformVariants={currentVariants}
            onVariantChange={
              hasResult || Object.keys(variants).length > 0 ? handleVariantChange : undefined
            }
            streaming={isGenerating}
            streamedContent={streamedContent}
          />
        </div>
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
