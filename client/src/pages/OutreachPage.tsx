import React, { useState } from 'react';
import { Target, Plus, Loader2 } from 'lucide-react';
import type { CreateOutreachCampaignInput } from '@postcommander/shared';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SequenceBuilder, type SequenceStep } from '../components/outreach/SequenceBuilder';
import { CampaignList } from '../components/outreach/CampaignList';
import { useCreateCampaign } from '../hooks/useOutreach';
import { LiveTerminal } from '../components/ui/LiveTerminal';
import { useAgentStream } from '../hooks/useAgentStream';

export default function OutreachPage() {
  const { logs, isConnected } = useAgentStream('outreach');
  const [showForm, setShowForm] = useState(false);
  const createMutation = useCreateCampaign();
  const [formData, setFormData] = useState<CreateOutreachCampaignInput>({
    name: '',
    targetKeywords: '',
    targetActivity: '',
    campaignGoal: '',
    platform: 'linkedin',
    dailyLimit: 15,
    steps: [
      { stepNumber: 1, delayDays: 0, promptTemplate: 'Write a short, engaging, and highly personalized linkedin message.' }
    ]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({
          name: '',
          targetKeywords: '',
          targetActivity: '',
          campaignGoal: '',
          platform: 'linkedin',
          dailyLimit: 15,
          steps: [
            { stepNumber: 1, delayDays: 0, promptTemplate: 'Write a short, engaging, and highly personalized linkedin message.' }
          ]
        });
        toast.success('Campagne créée avec succès');
      },
      onError: () => toast.error('Erreur lors de la création de la campagne')
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prospection (Outreach)</h1>
          <p className="text-muted-foreground mt-2">
            Trouvez des prospects et envoyez-leur des messages personnalisés automatiquement.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Campagne
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {showForm ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom de la campagne</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.name}
                    onChange={e => setFormData(d => ({ ...d, name: e.target.value }))}
                    placeholder="Ex: Directeurs Marketing SaaS"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Mots-clés cibles (Optionnel)</label>
                    <input
                      type="text"
                      className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.targetKeywords}
                      onChange={e => setFormData(d => ({ ...d, targetKeywords: e.target.value }))}
                      placeholder="Ex: CMO, Marketing Director"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Activité Cible (Déclencheur)</label>
                    <input
                      type="text"
                      className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.targetActivity || ''}
                      onChange={e => setFormData(d => ({ ...d, targetActivity: e.target.value }))}
                      placeholder="Ex: A commenté mon dernier post"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Plateforme</label>
                  <select
                    className="w-full bg-background border border-input rounded-lg px-4 py-2"
                    value={formData.platform}
                    onChange={e => setFormData(d => ({ ...d, platform: e.target.value as any }))}
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Objectif / Instructions pour le message</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.campaignGoal}
                    onChange={e => setFormData(d => ({ ...d, campaignGoal: e.target.value }))}
                    placeholder="Ex: Propose un appel de 15 minutes pour parler de l'automatisation de leur création de contenu. Sois direct, amical, et fais une référence à leur bio."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Limite d'envois journaliers</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    className="w-full bg-background border border-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.dailyLimit}
                    onChange={e => setFormData(d => ({ ...d, dailyLimit: parseInt(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Pour éviter d'être bloqué par la plateforme.</p>
                </div>

                <div className="border-t border-border pt-6">
                  <SequenceBuilder 
                    steps={formData.steps as SequenceStep[] || []} 
                    onChange={(newSteps) => setFormData(d => ({ ...d, steps: newSteps }))} 
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-muted-foreground hover:text-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                    Lancer la campagne
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <CampaignList />
          )}
        </div>
        <div className="lg:col-span-1 min-h-[500px]">
          <LiveTerminal logs={logs} isConnected={isConnected} title="Stagehand / Navigateur" />
        </div>
      </div>
    </motion.div>
  );
}
