import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Bot,
  Target,
  BarChart3,
  ArrowRight,
  Wand2,
  Lightbulb,
} from 'lucide-react';
import clsx from 'clsx';

interface WorkflowCard {
  to?: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  comingSoon?: boolean;
  gradient: string;
}

const WORKFLOWS: WorkflowCard[] = [
  {
    to: '/app/w/post',
    icon: Sparkles,
    title: 'Créer un post',
    description:
      'Wizard guidé en 4 étapes : brief → style → plateformes → génération. L\'IA t\'aide à remplir chaque champ.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    to: '/app/w/autoblog',
    icon: Bot,
    title: 'Lancer un blog auto',
    description:
      'Planifie une génération automatique d\'articles à intervalle régulier. Idéal pour SEO ou présence régulière.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    to: '/app/w/outreach',
    icon: Target,
    title: 'Lancer une campagne outreach',
    description:
      'SDR autonome : définis ton ICP, importe ou cherche des prospects, génère un message, planifie les relances.',
    gradient: 'from-orange-500 to-pink-500',
  },
  {
    to: '/app/w/analytics',
    icon: BarChart3,
    title: 'Analyser ma performance',
    description:
      'Rapport sur tes posts (impressions, engagement) + recommandations IA pour t\'améliorer.',
    gradient: 'from-blue-500 to-cyan-500',
  },
];

export function HubPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-8">
      {/* Hero */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-medium">
          <Wand2 size={12} aria-hidden="true" />
          {t('hub.tag', 'Hub guidé')}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
          {t('hub.title', 'Quoi faire aujourd\'hui ?')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          {t(
            'hub.subtitle',
            'Choisis un workflow guidé. Chaque assistant te pose les bonnes questions et utilise l\'IA pour t\'aider à remplir.',
          )}
        </p>
      </header>

      {/* Workflows grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {WORKFLOWS.map((wf) => {
          const Inner = (
            <article
              className={clsx(
                'group relative h-full p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900',
                'shadow-sm hover:shadow-xl transition-all duration-200',
                !wf.comingSoon && 'hover:-translate-y-0.5 cursor-pointer',
                wf.comingSoon && 'opacity-75',
              )}
            >
              <div
                className={clsx(
                  'inline-flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-md mb-4',
                  `bg-gradient-to-br ${wf.gradient}`,
                )}
              >
                <wf.icon size={22} aria-hidden="true" />
              </div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {wf.title}
                </h2>
                {wf.comingSoon && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    Bientôt
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {wf.description}
              </p>
              {!wf.comingSoon && (
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 group-hover:gap-2 transition-all">
                  Lancer l'assistant
                  <ArrowRight size={14} aria-hidden="true" />
                </div>
              )}
            </article>
          );

          return wf.comingSoon || !wf.to ? (
            <div key={wf.title}>{Inner}</div>
          ) : (
            <Link key={wf.title} to={wf.to}>
              {Inner}
            </Link>
          );
        })}
      </div>

      {/* Tip card */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-900">
        <div className="shrink-0 p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300">
          <Lightbulb size={16} aria-hidden="true" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-medium text-violet-900 dark:text-violet-200 mb-1">
            Mode expert disponible
          </p>
          <p className="text-violet-700 dark:text-violet-300/80">
            Si tu connais déjà l'outil, les 25+ fonctionnalités sont accessibles directement depuis
            le menu (mode <strong>Expert</strong> dans la sidebar).
          </p>
        </div>
      </div>
    </div>
  );
}
