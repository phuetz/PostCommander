import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FileText, MessageSquare, Share2, Sparkles, PenTool } from 'lucide-react';
import type { PlatformId, ToneId, LLMProviderId } from '@postcommander/shared';
import { Wizard, AIFillButton, type WizardStep } from '@/components/wizard';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { PlatformSelector } from '@/components/post/PlatformSelector';
import { ToneSelector } from '@/components/post/ToneSelector';
import { LLMSelector } from '@/components/post/LLMSelector';
import { PostPreview } from '@/components/post/PostPreview';
import { useGenerate } from '@/hooks/useGenerate';
import { createPost } from '@/services/api';

interface PostWizardData extends Record<string, unknown> {
  topic: string;
  audience: string;
  goal: 'awareness' | 'engagement' | 'leads' | 'sales';
  tone: ToneId;
  platforms: PlatformId[];
  provider: LLMProviderId;
  model: string;
}

const INITIAL: PostWizardData = {
  topic: '',
  audience: '',
  goal: 'engagement',
  tone: 'professional',
  platforms: ['linkedin'],
  provider: 'openai',
  model: 'gpt-4o-mini',
};

const GOAL_OPTIONS = [
  { value: 'awareness', label: 'Notoriété (faire connaître)' },
  { value: 'engagement', label: 'Engagement (likes, commentaires)' },
  { value: 'leads', label: 'Génération de leads' },
  { value: 'sales', label: 'Vente directe' },
] as const;

export function CreatePostWizard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isGenerating, streamedContent, result, error, generate, reset } = useGenerate();

  const steps: WizardStep<PostWizardData>[] = [
    {
      key: 'brief',
      title: 'Brief',
      description: 'Définir le sujet et l\'audience',
      icon: FileText,
      subtitle: 'De quoi parle ton post ?',
      helpTitle: 'Aide : le brief',
      helpContent: (
        <>
          <p>
            Un bon brief tient en 1 phrase et répond à : <strong>quoi</strong>, <strong>pour qui</strong>,{' '}
            <strong>pourquoi</strong>.
          </p>
          <p>
            <strong>Exemples qui marchent :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>« Annoncer le lancement de notre feature X aux CTO B2B »</li>
            <li>« Partager mon retour d'expérience sur le scaling Postgres »</li>
            <li>« Démystifier le RAG pour les développeurs juniors »</li>
          </ul>
          <p>
            <strong>Pièges à éviter :</strong> brief trop vague ("la tech"), trop long (3 phrases), ou
            qui mélange plusieurs sujets.
          </p>
        </>
      ),
      validate: (d) => {
        const errs: Record<string, string> = {};
        if (!d.topic.trim()) errs.topic = 'Le sujet est requis';
        if (d.topic.trim().length < 6) errs.topic = 'Sujet trop court (min 6 caractères)';
        return Object.keys(errs).length > 0 ? errs : null;
      },
      render: (ctx) => (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sujet du post
              </label>
              <AIFillButton
                field="topic"
                context={{ audience: ctx.data.audience, goal: ctx.data.goal }}
                onFilled={(v) => ctx.setData({ topic: v })}
              />
            </div>
            <Input
              value={ctx.data.topic}
              onChange={(e) => ctx.setData({ topic: e.target.value })}
              placeholder="Ex: Pourquoi nous avons abandonné REST pour gRPC en production"
              error={ctx.errors.topic}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Audience cible
              </label>
              <AIFillButton
                field="audience"
                context={{ topic: ctx.data.topic }}
                onFilled={(v) => ctx.setData({ audience: v })}
              />
            </div>
            <Input
              value={ctx.data.audience}
              onChange={(e) => ctx.setData({ audience: e.target.value })}
              placeholder="Ex: Backend engineers seniors, écosystème Go/Python"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Objectif
            </label>
            <select
              value={ctx.data.goal}
              onChange={(e) =>
                ctx.setData({ goal: e.target.value as PostWizardData['goal'] })
              }
              className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              {GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </>
      ),
    },
    {
      key: 'style',
      title: 'Style',
      description: 'Choisir le ton de communication',
      icon: MessageSquare,
      subtitle: 'Quel ton donner ?',
      helpTitle: 'Aide : le ton',
      helpContent: (
        <>
          <p>
            Le ton change radicalement la perception. Choisis-le en fonction de :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Audience</strong> : les seniors aiment le ton technique direct ; les juniors
              préfèrent le pédagogique.
            </li>
            <li>
              <strong>Plateforme</strong> : LinkedIn = professionnel, Twitter = punchy, Instagram =
              chaleureux.
            </li>
            <li>
              <strong>Objectif</strong> : conversion = direct ; awareness = inspirant.
            </li>
          </ul>
          <p>Tu peux aussi cliquer sur le bouton IA pour qu'on te suggère un ton.</p>
        </>
      ),
      render: (ctx) => (
        <>
          <div className="flex items-center justify-end mb-2">
            <AIFillButton
              field="tone"
              context={{ topic: ctx.data.topic, audience: ctx.data.audience }}
              onFilled={(v) => {
                const lower = v.toLowerCase();
                const matches = [
                  'professional',
                  'conversational',
                  'inspirational',
                  'witty',
                  'authoritative',
                  'humorous',
                  'casual',
                  'formal',
                ];
                const found = matches.find((m) => lower.includes(m.slice(0, 6)));
                if (found) {
                  ctx.setData({ tone: found as ToneId });
                } else {
                  toast.success(`Suggestion IA: "${v}" — choisis manuellement`);
                }
              }}
              label="Suggérer un ton"
            />
          </div>
          <ToneSelector
            selected={ctx.data.tone}
            onChange={(t: ToneId) => ctx.setData({ tone: t })}
          />
        </>
      ),
    },
    {
      key: 'platforms',
      title: 'Plateformes',
      description: 'Sélectionner les réseaux',
      icon: Share2,
      subtitle: 'Où publier ?',
      helpTitle: 'Aide : les plateformes',
      helpContent: (
        <>
          <p>L'IA adapte le contenu à chaque plateforme sélectionnée :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>LinkedIn</strong> : 3000 caractères, format long, professionnel
            </li>
            <li>
              <strong>Twitter/X</strong> : 280 caractères, accroche immédiate
            </li>
            <li>
              <strong>Instagram</strong> : 2200 caractères, visuel + hashtags
            </li>
            <li>
              <strong>Facebook</strong> : 5000 caractères, conversationnel
            </li>
          </ul>
          <p>Tu peux sélectionner plusieurs plateformes — chacune aura sa variante.</p>
        </>
      ),
      validate: (d) =>
        d.platforms.length === 0 ? { platforms: 'Sélectionne au moins une plateforme' } : null,
      render: (ctx) => (
        <>
          <PlatformSelector
            selected={ctx.data.platforms}
            onChange={(p) => ctx.setData({ platforms: p })}
          />
          <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
            <LLMSelector
              provider={ctx.data.provider}
              model={ctx.data.model}
              onProviderChange={(p: LLMProviderId) => ctx.setData({ provider: p })}
              onModelChange={(m: string) => ctx.setData({ model: m })}
            />
          </div>
        </>
      ),
    },
    {
      key: 'generate',
      title: 'Génération',
      description: 'Créer et réviser',
      icon: Sparkles,
      subtitle: 'Lance et révise',
      helpTitle: 'Aide : la génération',
      helpContent: (
        <>
          <p>
            L'IA va générer le post puis une variante adaptée à chaque plateforme. Tu peux relancer
            si le résultat ne te plaît pas.
          </p>
          <p>
            Une fois satisfait, clique sur <strong>Terminer</strong> — le brouillon est sauvegardé
            dans ton historique.
          </p>
        </>
      ),
      render: (ctx) => {
        const handleGenerate = () => {
          generate(
            {
              prompt: ctx.data.topic,
              platforms: ctx.data.platforms,
              tone: ctx.data.tone,
              provider: ctx.data.provider,
              model: ctx.data.model,
              language: 'fr',
            },
            true,
          );
        };

        const hasResult = result !== null;

        return (
          <>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-1.5 text-sm">
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">Sujet : </span>
                <span className="text-gray-900 dark:text-gray-100">{ctx.data.topic}</span>
              </div>
              {ctx.data.audience && (
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Audience : </span>
                  <span className="text-gray-900 dark:text-gray-100">{ctx.data.audience}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">Plateformes : </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {ctx.data.platforms.join(', ')}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-500 dark:text-gray-400">Ton : </span>
                <span className="text-gray-900 dark:text-gray-100">{ctx.data.tone}</span>
              </div>
            </div>

            {!hasResult && !isGenerating && (
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
              >
                Lancer la génération
              </button>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {(isGenerating || hasResult) && (
              <PostPreview
                platforms={ctx.data.platforms}
                platformVariants={result?.platformVariants || {}}
                streaming={isGenerating}
                streamedContent={streamedContent}
              />
            )}

            {hasResult && !isGenerating && (
              <button
                type="button"
                onClick={() => {
                  reset();
                  handleGenerate();
                }}
                className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 underline"
              >
                Relancer la génération
              </button>
            )}
          </>
        );
      },
    },
  ];

  const handleComplete = async (data: PostWizardData) => {
    if (!result) {
      toast.error('Lance d\'abord la génération à l\'étape précédente');
      return;
    }
    try {
      await createPost({
        content: result.content,
        originalPrompt: data.topic,
        tone: data.tone,
        llmProvider: data.provider,
        llmModel: data.model,
        platforms: data.platforms,
        platformVariants: result.platformVariants,
        hashtags: result.hashtags,
        status: 'draft',
        scheduledAt: null,
        publishedAt: null,
      });
      toast.success(t('wizard.savedDraft', 'Brouillon sauvegardé'));
      navigate('/app/history');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    }
  };

  return (
    <Wizard
      title="Créer un post"
      subtitle="Assistant guidé en 4 étapes"
      icon={PenTool}
      steps={steps}
      initialData={INITIAL}
      onComplete={handleComplete}
      completeLabel="Sauvegarder le brouillon"
      rightAside={
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-semibold">
            <span>💡</span>
            <span>Astuce du moment</span>
          </div>
          <p className="text-violet-700 dark:text-violet-300/90 leading-relaxed">
            Clique sur le bouton{' '}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200 text-xs font-bold">
              ✨ IA
            </span>{' '}
            à côté de chaque champ pour qu'on te propose une valeur. Tu peux toujours modifier la
            suggestion ensuite.
          </p>
          <hr className="border-violet-200 dark:border-violet-800" />
          <p className="text-violet-700 dark:text-violet-300/90 leading-relaxed text-xs">
            Plus tu remplis les premiers champs (sujet, audience), plus les suggestions IA pour les
            suivants seront pertinentes.
          </p>
        </div>
      }
    />
  );
}
