import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Wizard, type WizardStep } from '@/components/wizard';
import { getAnalyticsOverview, type AnalyticsOverview } from '@/services/api';

interface AnalyticsWizardData extends Record<string, unknown> {
  period: '7' | '30' | '90';
  // overview is filled at step 2 by an internal fetch
  overview?: AnalyticsOverview;
  insights?: string[];
}

const INITIAL: AnalyticsWizardData = {
  period: '30',
};

export function AnalyticsWizard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const steps: WizardStep<AnalyticsWizardData>[] = [
    {
      key: 'period',
      title: 'Période',
      subtitle: 'Sur quelle fenêtre veux-tu analyser ?',
      helpTitle: 'Aide : choisir une période',
      helpContent: (
        <>
          <p>
            <strong>7 jours</strong> : trop court pour des tendances fiables, bon pour
            réactivité.
          </p>
          <p>
            <strong>30 jours</strong> : le sweet-spot — assez de données, pas trop ancien.
            Recommandé.
          </p>
          <p>
            <strong>90 jours</strong> : pour repérer des changements structurels (saisonnalité,
            audience).
          </p>
        </>
      ),
      render: (ctx) => (
        <div className="grid grid-cols-3 gap-3">
          {(['7', '30', '90'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => ctx.setData({ period: p })}
              className={
                ctx.data.period === p
                  ? 'p-4 rounded-lg border-2 border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-left'
                  : 'p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 text-left'
              }
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {p}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">jours</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      key: 'report',
      title: 'Rapport',
      subtitle: 'Vue d\'ensemble',
      helpTitle: 'Aide : lire le rapport',
      helpContent: (
        <>
          <p>Les chiffres viennent de tes posts publiés sur la période choisie.</p>
          <p>
            <strong>Conseils :</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Si <em>Brouillons</em> &gt; <em>Publiés</em>, tu produis sans diffuser → lance plus de
              campagnes via les wizards.
            </li>
            <li>
              Si une plateforme domine, c'est ton canal n°1 — concentre l'effort dessus.
            </li>
          </ul>
        </>
      ),
      render: (ctx) => {
        if (loading) {
          return (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="animate-spin mr-2" size={20} />
              Chargement du rapport…
            </div>
          );
        }

        if (!ctx.data.overview) {
          return (
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const overview = await getAnalyticsOverview();
                  ctx.setData({ overview });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Erreur de chargement');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium hover:shadow-lg transition-all"
            >
              <BarChart3 size={18} aria-hidden="true" />
              Générer le rapport
            </button>
          );
        }

        const ov = ctx.data.overview;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Posts" value={ov.totalPosts} />
              <Stat label="Publiés" value={ov.byStatus.published ?? 0} />
              <Stat label="Programmés" value={ov.byStatus.scheduled ?? 0} />
              <Stat label="Brouillons" value={ov.byStatus.draft ?? 0} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Répartition par plateforme
              </h3>
              <div className="space-y-1.5">
                {Object.entries(ov.byPlatform).map(([platform, count]) => (
                  <div key={platform} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {platform}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"
                        style={{
                          width: `${Math.min(100, ((count as number) / Math.max(1, ov.totalPosts)) * 100)}%`,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-900 dark:text-gray-100">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold text-sm mb-1">
                  <TrendingUp size={14} aria-hidden="true" />
                  Force
                </div>
                <p className="text-xs text-green-700 dark:text-green-300/90">
                  {topPlatform(ov.byPlatform)
                    ? `${topPlatform(ov.byPlatform)} domine ta distribution — bon canal pivot.`
                    : 'Aucun post publié pour l\'instant — lance le wizard Créer un post.'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-sm mb-1">
                  <TrendingDown size={14} aria-hidden="true" />
                  À surveiller
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300/90">
                  {(ov.byStatus.draft ?? 0) > (ov.byStatus.published ?? 0)
                    ? 'Tu as plus de brouillons que de posts publiés. Pense à publier tes drafts.'
                    : 'Continue à diversifier les sujets pour ne pas saturer une niche.'}
                </p>
              </div>
            </div>
          </div>
        );
      },
    },
  ];

  const handleComplete = async () => {
    navigate('/app');
  };

  return (
    <Wizard
      title="Analyser ma performance"
      subtitle="Rapport rapide sur tes derniers posts"
      steps={steps}
      initialData={INITIAL}
      onComplete={handleComplete}
      completeLabel="Retour au hub"
      rightAside={
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
            <span>📊</span>
            <span>Pourquoi analyser ?</span>
          </div>
          <p className="text-blue-700 dark:text-blue-300/90 leading-relaxed">
            La data te dit ce qui marche. Sans analyse, tu produis dans le vide. Le rapport te montre
            ta plateforme dominante et le ratio publication / production.
          </p>
        </div>
      }
    />
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800">
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function topPlatform(byPlatform: Record<string, number>): string | null {
  const entries = Object.entries(byPlatform);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[1] > 0 ? entries[0][0] : null;
}
