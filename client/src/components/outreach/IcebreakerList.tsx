import React from 'react';
import toast from 'react-hot-toast';
import { BrainCircuit } from 'lucide-react';

interface EmpathyAnalysis {
  personaType: string;
  psychometricProfile: string;
  recommendedTone: string;
  icebreakers: string[];
}

interface IcebreakerListProps {
  suspectUrl: string;
  empathyAnalysis: EmpathyAnalysis;
  campaigns: any[];
  selectedCampaign: string;
  onCampaignSelect: (url: string, campaignId: string) => void;
  onAdd: (ice: string) => void;
  isAdding: boolean;
}

export function IcebreakerList({
  suspectUrl,
  empathyAnalysis,
  campaigns,
  selectedCampaign,
  onCampaignSelect,
  onAdd,
  isAdding
}: IcebreakerListProps) {
  return (
    <div className="mt-6 border-t border-brand-500/20 pt-6 bg-brand-500/5 p-4 rounded-xl">
      <h5 className="text-sm font-bold flex items-center gap-2 mb-4 text-brand-600 dark:text-brand-400">
        <BrainCircuit className="w-4 h-4" /> PROFIL PSYCHOLOGIQUE & ICEBREAKERS
      </h5>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase">Persona Identifié</p>
          <p className="text-sm font-medium">{empathyAnalysis.personaType}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase">Analyse Psychométrique</p>
          <p className="text-sm">{empathyAnalysis.psychometricProfile}</p>
        </div>
        <div className="bg-muted p-3 rounded-lg border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Tone of Voice Recommandé</p>
          <p className="text-sm italic">"{empathyAnalysis.recommendedTone}"</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Propositions d'Approche (Icebreakers)</p>
          <div className="space-y-3">
            {empathyAnalysis.icebreakers.map((ice, i) => (
              <div key={i} className="bg-background border border-brand-500/30 p-4 rounded-xl text-sm transition-colors hover:border-brand-500 flex flex-col gap-3">
                <p className="whitespace-pre-wrap">{ice}</p>
                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border/50">
                  <select 
                    className="flex-1 text-xs bg-muted border-border rounded-md px-2 py-1.5 focus:ring-brand-500"
                    value={selectedCampaign}
                    onChange={(e) => onCampaignSelect(suspectUrl, e.target.value)}
                  >
                    <option value="">Sélectionner une campagne...</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => onAdd(ice)}
                    disabled={isAdding}
                    className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    🚀 Ajouter à la Campagne
                  </button>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(ice); toast.success('Copié !'); }}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-md text-xs transition-colors whitespace-nowrap"
                  >
                    Copier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
