import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { OutreachPlatform } from '@postcommander/shared';
import { Wizard, AIFillButton, type WizardStep } from '@/components/wizard';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { createCampaign } from '@/services/outreach';

interface OutreachWizardData extends Record<string, unknown> {
  name: string;
  product: string;
  icp_industry: string;
  icp_role: string;
  icp_region: string;
  keywords: string;
  campaignGoal: string;
  messageTemplate: string;
  platform: OutreachPlatform;
  dailyLimit: number;
}

const INITIAL: OutreachWizardData = {
  name: '',
  product: '',
  icp_industry: '',
  icp_role: '',
  icp_region: '',
  keywords: '',
  campaignGoal: '',
  messageTemplate: '',
  platform: 'linkedin',
  dailyLimit: 20,
};

const PLATFORM_OPTIONS: { value: OutreachPlatform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'email', label: 'Email' },
];

export function OutreachWizard() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const steps: WizardStep<OutreachWizardData>[] = [
    {
      key: 'icp',
      title: 'ICP',
      subtitle: 'Qui veux-tu atteindre ?',
      helpTitle: 'Aide : définir un ICP (Ideal Customer Profile)',
      helpContent: (
        <>
          <p>
            L'ICP est la cible idéale. Plus il est précis, plus l'outreach est efficace. Définis-le
            par 3 dimensions :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Industrie</strong> : SaaS B2B, e-commerce mode, cabinets comptables...
            </li>
            <li>
              <strong>Rôle</strong> : CTO, Head of Growth, Directeur Marketing...
            </li>
            <li>
              <strong>Région</strong> : France, Europe, US, monde...
            </li>
          </ul>
          <p>
            Décris d'abord <strong>ton produit</strong> en 1 phrase — l'IA s'en sert pour suggérer
            l'industrie et le rôle pertinents.
          </p>
        </>
      ),
      validate: (d) => {
        const errs: Record<string, string> = {};
        if (!d.name.trim()) errs.name = 'Nom de campagne requis';
        if (!d.product.trim()) errs.product = 'Description du produit requise';
        if (!d.icp_industry.trim()) errs.icp_industry = 'Industrie cible requise';
        if (!d.icp_role.trim()) errs.icp_role = 'Rôle cible requis';
        return Object.keys(errs).length > 0 ? errs : null;
      },
      render: (ctx) => (
        <>
          <Input
            label="Nom de la campagne"
            value={ctx.data.name}
            onChange={(e) => ctx.setData({ name: e.target.value })}
            placeholder="Ex: Q2 2026 - CTO SaaS France"
            error={ctx.errors.name}
          />
          <TextArea
            label="Ton produit / service (1 phrase)"
            value={ctx.data.product}
            onChange={(e) => ctx.setData({ product: e.target.value })}
            placeholder="Ex: PostCommander, un outil SaaS de génération et publication multi-plateforme de posts sociaux"
            rows={2}
            error={ctx.errors.product}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Industrie
                </label>
                <AIFillButton
                  field="icp_industry"
                  context={{ product: ctx.data.product }}
                  onFilled={(v) => ctx.setData({ icp_industry: v })}
                />
              </div>
              <Input
                value={ctx.data.icp_industry}
                onChange={(e) => ctx.setData({ icp_industry: e.target.value })}
                placeholder="SaaS B2B"
                error={ctx.errors.icp_industry}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rôle
                </label>
                <AIFillButton
                  field="icp_role"
                  context={{
                    industry: ctx.data.icp_industry,
                    product: ctx.data.product,
                  }}
                  onFilled={(v) => ctx.setData({ icp_role: v })}
                />
              </div>
              <Input
                value={ctx.data.icp_role}
                onChange={(e) => ctx.setData({ icp_role: e.target.value })}
                placeholder="Head of Growth"
                error={ctx.errors.icp_role}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Région
                </label>
                <AIFillButton
                  field="icp_region"
                  context={{ industry: ctx.data.icp_industry }}
                  onFilled={(v) => ctx.setData({ icp_region: v })}
                />
              </div>
              <Input
                value={ctx.data.icp_region}
                onChange={(e) => ctx.setData({ icp_region: e.target.value })}
                placeholder="France, Europe"
              />
            </div>
          </div>
        </>
      ),
    },
    {
      key: 'source',
      title: 'Source',
      subtitle: 'Où chercher les prospects ?',
      helpTitle: 'Aide : mots-clés et plateforme',
      helpContent: (
        <>
          <p>
            Pour LinkedIn et Twitter, l'outil utilise les <strong>mots-clés</strong> que tu donnes
            pour scraper les profils correspondants.
          </p>
          <p>
            <strong>Bons mots-clés</strong> : termes précis qu'on trouve dans les bios LinkedIn —
            "Head of Growth", "VP Engineering SaaS", "founder fintech"...
          </p>
          <p>Sépare par virgules pour cumuler plusieurs requêtes.</p>
        </>
      ),
      validate: (d) => (!d.keywords.trim() ? { keywords: 'Mots-clés requis' } : null),
      render: (ctx) => (
        <>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plateforme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PLATFORM_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => ctx.setData({ platform: p.value })}
                  className={
                    ctx.data.platform === p.value
                      ? 'px-3 py-2 rounded-lg border border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium text-sm'
                      : 'px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm hover:border-gray-300'
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <TextArea
            label="Mots-clés de recherche (séparés par virgules)"
            value={ctx.data.keywords}
            onChange={(e) => ctx.setData({ keywords: e.target.value })}
            placeholder="Head of Growth SaaS, VP Marketing B2B, CMO scaleup"
            rows={3}
            error={ctx.errors.keywords}
          />

          <Input
            label="Objectif de la campagne (1 phrase)"
            value={ctx.data.campaignGoal}
            onChange={(e) => ctx.setData({ campaignGoal: e.target.value })}
            placeholder="Décrocher 20 démos qualifiées en 4 semaines"
          />
        </>
      ),
    },
    {
      key: 'message',
      title: 'Message',
      subtitle: 'Le template envoyé à chaque prospect',
      helpTitle: 'Aide : écrire un bon message d\'outreach',
      helpContent: (
        <>
          <p>
            <strong>Règles d'or :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Court (3-4 phrases max)</li>
            <li>Personnalisable (l'IA remplit les variables du prospect)</li>
            <li>Pas de "J'espère que tu vas bien" / "J'ai vu ton profil"</li>
            <li>Commence par une observation pertinente</li>
            <li>Finis par une question simple ou un CTA léger</li>
          </ul>
          <p>
            Clique sur le bouton <strong>✨ IA</strong> pour qu'on te génère un brouillon basé sur
            ton ICP et ton produit.
          </p>
        </>
      ),
      validate: (d) =>
        !d.messageTemplate.trim()
          ? { messageTemplate: 'Message requis' }
          : d.messageTemplate.length < 50
            ? { messageTemplate: 'Message trop court (min 50 caractères)' }
            : null,
      render: (ctx) => (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Template du message
              </label>
              <AIFillButton
                field="outreach_message"
                context={{
                  icp_industry: ctx.data.icp_industry,
                  icp_role: ctx.data.icp_role,
                  icp_region: ctx.data.icp_region,
                  product: ctx.data.product,
                }}
                onFilled={(v) => ctx.setData({ messageTemplate: v })}
                label="Générer avec IA"
                size="md"
              />
            </div>
            <TextArea
              value={ctx.data.messageTemplate}
              onChange={(e) => ctx.setData({ messageTemplate: e.target.value })}
              placeholder="Hello {first_name}, j'ai vu que tu pilotes la croissance chez {company}..."
              rows={6}
              error={ctx.errors.messageTemplate}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Variables disponibles : <code>{'{first_name}'}</code>, <code>{'{company}'}</code>,{' '}
              <code>{'{role}'}</code>
            </p>
          </div>
        </>
      ),
    },
    {
      key: 'launch',
      title: 'Lancement',
      subtitle: 'Limites et démarrage',
      helpTitle: 'Aide : la limite quotidienne',
      helpContent: (
        <>
          <p>
            <strong>Limite quotidienne</strong> : ne dépasse pas 20-30 / jour sur LinkedIn pour
            éviter le throttling. Email : 50-100 OK.
          </p>
          <p>
            Tu pourras mettre la campagne en pause à tout moment depuis la page Outreach.
          </p>
        </>
      ),
      render: (ctx) => (
        <>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-1.5 text-sm">
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Campagne : </span>
              <span className="text-gray-900 dark:text-gray-100">{ctx.data.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Plateforme : </span>
              <span className="text-gray-900 dark:text-gray-100">{ctx.data.platform}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">ICP : </span>
              <span className="text-gray-900 dark:text-gray-100">
                {ctx.data.icp_role} en {ctx.data.icp_industry}
                {ctx.data.icp_region && ` (${ctx.data.icp_region})`}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">Mots-clés : </span>
              <span className="text-gray-900 dark:text-gray-100">{ctx.data.keywords}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Limite quotidienne (nombre de prospects contactés / jour)
            </label>
            <Input
              type="number"
              min="1"
              max="100"
              value={String(ctx.data.dailyLimit)}
              onChange={(e) =>
                ctx.setData({ dailyLimit: Math.max(1, parseInt(e.target.value, 10) || 20) })
              }
            />
          </div>
        </>
      ),
    },
  ];

  const handleComplete = async (data: OutreachWizardData) => {
    setSubmitting(true);
    try {
      await createCampaign({
        name: data.name,
        targetKeywords: data.keywords,
        campaignGoal: data.campaignGoal || `${data.icp_role} en ${data.icp_industry}`,
        platform: data.platform,
        dailyLimit: data.dailyLimit,
      });
      toast.success('Campagne créée ! Découverte des prospects en cours…');
      navigate('/app/outreach');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de création');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Wizard
      title="Lancer une campagne outreach"
      subtitle="Assistant SDR : ICP → prospects → message → lancement"
      steps={steps}
      initialData={INITIAL}
      onComplete={handleComplete}
      completeLabel={submitting ? 'Création...' : 'Créer la campagne'}
      rightAside={
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-semibold">
            <span>📨</span>
            <span>Workflow SDR</span>
          </div>
          <p className="text-orange-700 dark:text-orange-300/90 leading-relaxed">
            Une fois la campagne créée, le worker découvre les prospects, génère un message
            personnalisé pour chacun, et les envoie au rythme de ta limite quotidienne.
          </p>
          <p className="text-orange-700 dark:text-orange-300/90 leading-relaxed text-xs">
            Suis les réponses depuis l'<strong>Inbox</strong>.
          </p>
        </div>
      }
    />
  );
}
