import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { LLMProviderId } from '@postcommander/shared';
import { Wizard, AIFillButton, type WizardStep } from '@/components/wizard';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { LLMSelector } from '@/components/post/LLMSelector';
import { createAutoBlogConfig } from '@/services/autoblog';

type ArticleType = 'fond-technique' | 'news-comment' | 'opinion-perso';
type Frequency = 'daily' | 'weekly' | 'biweekly';

interface AutoBlogWizardData extends Record<string, unknown> {
  topic: string;
  audience: string;
  articleType: ArticleType;
  frequency: Frequency;
  authorName: string;
  authorRole: string;
  authorReferences: string;
  provider: LLMProviderId;
  model: string;
}

const INITIAL: AutoBlogWizardData = {
  topic: '',
  audience: '',
  articleType: 'fond-technique',
  frequency: 'weekly',
  authorName: '',
  authorRole: '',
  authorReferences: '',
  provider: 'openai',
  model: 'gpt-4o',
};

const ARTICLE_TYPES = [
  { value: 'fond-technique', label: 'Fond technique (pédagogique, problème/solution)' },
  { value: 'news-comment', label: 'News commentée (réaction à une actualité)' },
  { value: 'opinion-perso', label: 'Opinion personnelle (essai, prise de position)' },
] as const;

const FREQUENCIES = [
  { value: 'daily', label: 'Tous les jours' },
  { value: 'weekly', label: 'Toutes les semaines' },
  { value: 'biweekly', label: 'Toutes les deux semaines' },
] as const;

export function AutoBlogWizard() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const steps: WizardStep<AutoBlogWizardData>[] = [
    {
      key: 'subject',
      title: 'Sujet & audience',
      subtitle: 'Sur quoi écrire automatiquement ?',
      helpTitle: 'Aide : choisir un sujet pour l\'autopilot',
      helpContent: (
        <>
          <p>
            L'autopilot va générer des articles autour d'un <strong>sujet large</strong> à intervalle
            régulier. Choisis un sujet assez vaste pour avoir 10+ angles, mais assez précis pour
            rester cohérent.
          </p>
          <p>
            <strong>Bons exemples :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>« L'observabilité backend en production »</li>
            <li>« La culture produit chez les startups B2B »</li>
            <li>« La gestion d'équipe distribuée »</li>
          </ul>
          <p>Évite les sujets trop génériques ("le tech") ou trop niche ("Kubernetes 1.28 patch").</p>
        </>
      ),
      validate: (d) =>
        !d.topic.trim()
          ? { topic: 'Sujet requis' }
          : d.topic.trim().length < 8
            ? { topic: 'Sujet trop court (min 8 caractères)' }
            : null,
      render: (ctx) => (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sujet général
              </label>
              <AIFillButton
                field="blog_topic"
                context={{ audience: ctx.data.audience }}
                onFilled={(v) => ctx.setData({ topic: v })}
              />
            </div>
            <Input
              value={ctx.data.topic}
              onChange={(e) => ctx.setData({ topic: e.target.value })}
              placeholder="Ex: L'observabilité backend en production"
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
              placeholder="Ex: SREs et lead engineers de scaleups B2B"
            />
          </div>
        </>
      ),
    },
    {
      key: 'cadence',
      title: 'Format & cadence',
      subtitle: 'À quelle fréquence et quel style ?',
      helpTitle: 'Aide : type d\'article et fréquence',
      helpContent: (
        <>
          <p>
            <strong>Fréquence :</strong> commence par hebdomadaire. Quotidien = volume élevé, demande
            du recul. Bi-mensuel = plus stratégique.
          </p>
          <p>
            <strong>Type d'article :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <em>Fond technique</em> : ~1500 mots, structure problème/solution. SEO friendly.
            </li>
            <li>
              <em>News commentée</em> : ~800 mots, réagir à l'actualité. Plus court.
            </li>
            <li>
              <em>Opinion perso</em> : 800-1200 mots, essai, ton personnel.
            </li>
          </ul>
        </>
      ),
      render: (ctx) => (
        <>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type d'article
            </label>
            <select
              value={ctx.data.articleType}
              onChange={(e) =>
                ctx.setData({ articleType: e.target.value as ArticleType })
              }
              className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              {ARTICLE_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fréquence de génération
            </label>
            <select
              value={ctx.data.frequency}
              onChange={(e) =>
                ctx.setData({ frequency: e.target.value as Frequency })
              }
              className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

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
      key: 'author',
      title: 'Signature',
      subtitle: 'Qui signe les articles ?',
      helpTitle: 'Aide : signature et références',
      helpContent: (
        <>
          <p>
            La signature aide le LLM à adopter ta voix. Plus tu donnes de contexte (rôle,
            projets/références), plus le contenu sonnera comme toi.
          </p>
          <p>
            <strong>Références</strong> : liste tes produits, projets, articles connus (séparés par
            virgules). Le LLM pourra y faire référence quand pertinent.
          </p>
        </>
      ),
      render: (ctx) => (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nom de l'auteur"
              value={ctx.data.authorName}
              onChange={(e) => ctx.setData({ authorName: e.target.value })}
              placeholder="Patrice Huetz"
            />
            <Input
              label="Rôle / Expertise"
              value={ctx.data.authorRole}
              onChange={(e) => ctx.setData({ authorRole: e.target.value })}
              placeholder="architecte logiciel"
            />
          </div>
          <TextArea
            label="Références catalogue (séparées par virgules)"
            value={ctx.data.authorReferences}
            onChange={(e) => ctx.setData({ authorReferences: e.target.value })}
            placeholder="GitNexus, La Boucle Ralph, PostCommander"
            rows={2}
          />
        </>
      ),
    },
    {
      key: 'review',
      title: 'Récap & lancement',
      subtitle: 'Vérifie et active l\'autopilot',
      render: (ctx) => (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-1.5 text-sm">
          <Row label="Sujet" value={ctx.data.topic} />
          <Row label="Audience" value={ctx.data.audience || '—'} />
          <Row
            label="Type"
            value={ARTICLE_TYPES.find((a) => a.value === ctx.data.articleType)?.label || ''}
          />
          <Row
            label="Fréquence"
            value={FREQUENCIES.find((f) => f.value === ctx.data.frequency)?.label || ''}
          />
          <Row label="Auteur" value={ctx.data.authorName || '—'} />
          <Row label="Modèle" value={`${ctx.data.provider} / ${ctx.data.model}`} />
        </div>
      ),
    },
  ];

  const handleComplete = async (data: AutoBlogWizardData) => {
    setSubmitting(true);
    try {
      await createAutoBlogConfig({
        topic: data.topic,
        articleType: data.articleType,
        frequency: data.frequency,
        provider: data.provider,
        model: data.model,
        authorName: data.authorName || undefined,
        authorRole: data.authorRole || undefined,
        authorReferences: data.authorReferences || undefined,
        status: 'active',
      });
      toast.success('Autopilot blog activé !');
      navigate('/app/autoblog');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Wizard
      title="Lancer un blog auto"
      subtitle="L'IA génère des articles régulièrement, selon ton sujet et ta voix"
      steps={steps}
      initialData={INITIAL}
      onComplete={handleComplete}
      completeLabel={submitting ? 'Création...' : 'Activer l\'autopilot'}
      rightAside={
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
            <span>🤖</span>
            <span>Comment ça marche</span>
          </div>
          <p className="text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
            Une fois activé, le moteur génère un article à la fréquence choisie, en utilisant ta
            signature et tes références. Les brouillons apparaissent dans <strong>Historique</strong>
            — tu valides avant publication.
          </p>
        </div>
      }
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-medium text-gray-500 dark:text-gray-400">{label} : </span>
      <span className="text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}
