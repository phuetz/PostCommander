import { CheckCircle2, ExternalLink, Loader2, Unlink, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCodexAuth } from '@/hooks/useCodexAuth';

export function ChatGPTProSection() {
  const { status, loading, connecting, connect, disconnect } = useCodexAuth();

  return (
    <Card>
      <div className="space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Compte ChatGPT Pro
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Utilise ton abonnement ChatGPT Pro/Plus comme provider LLM (sans clé API).
              </p>
            </div>
          </div>
          {status.connected && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={12} aria-hidden="true" />
              Connecté
            </span>
          )}
        </header>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Chargement…
          </div>
        ) : status.connected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {status.email && (
                <InfoRow label="Email" value={status.email} />
              )}
              {status.planType && (
                <InfoRow label="Plan" value={status.planType} />
              )}
              {status.accountId && (
                <InfoRow label="Account ID" value={status.accountId} mono />
              )}
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={disconnect}
              icon={<Unlink size={14} aria-hidden="true" />}
            >
              Déconnecter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                Clique pour ouvrir l'écran de connexion ChatGPT. Le serveur écoute sur{' '}
                <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs">
                  localhost:1455
                </code>{' '}
                pour récupérer la session.
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Si le port 1455 est occupé, tu peux aussi te connecter via la CLI :{' '}
                <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40">
                  node scripts/pc-login-chatgpt.mjs
                </code>
              </p>
            </div>
            <Button
              onClick={connect}
              loading={connecting}
              icon={<ExternalLink size={16} aria-hidden="true" />}
            >
              {connecting ? 'En attente de la connexion…' : 'Se connecter à ChatGPT Pro'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div
        className={
          mono
            ? 'text-xs font-mono text-gray-700 dark:text-gray-300 break-all'
            : 'text-sm text-gray-900 dark:text-gray-100'
        }
      >
        {value}
      </div>
    </div>
  );
}
