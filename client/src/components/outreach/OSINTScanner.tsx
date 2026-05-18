import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Search, User, Linkedin, ExternalLink, AlertCircle, FileText, BrainCircuit } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

import { ProfileScanner } from './ProfileScanner';
import { DossierViewer } from './DossierViewer';
import { IcebreakerList } from './IcebreakerList';

interface Suspect {
  title: string;
  url: string;
  content: string;
}

interface EnrichedProfileData {
  name: string;
  headline: string;
  location: string;
  about: string;
  experiences: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    duration: string;
  }>;
}

interface EmpathyAnalysis {
  personaType: string;
  psychometricProfile: string;
  recommendedTone: string;
  icebreakers: string[];
}

interface ContactData {
  email: string | null;
  phone: string | null;
  method: string;
  isVerified: boolean;
}

interface ScanAnalysis {
  extractedText: string[];
  estimatedProfession: string;
  companyOrEvent?: string;
  searchQuery: string;
}

export function OSINTScanner() {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [useDeepScan, setUseDeepScan] = useState(false);
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  
  const [enrichingUrls, setEnrichingUrls] = useState<Set<string>>(new Set());
  const [enrichedProfiles, setEnrichedProfiles] = useState<Record<string, EnrichedProfileData>>({});
  
  const [dossiers, setDossiers] = useState<Record<string, string>>({});
  const [generatingDossiers, setGeneratingDossiers] = useState<Set<string>>(new Set());
  
  const [empathyAnalyses, setEmpathyAnalyses] = useState<Record<string, EmpathyAnalysis>>({});
  const [generatingEmpathy, setGeneratingEmpathy] = useState<Set<string>>(new Set());
  
  const [contacts, setContacts] = useState<Record<string, ContactData>>({});
  const [findingContacts, setFindingContacts] = useState<Set<string>>(new Set());
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [addingToCampaign, setAddingToCampaign] = useState<Set<string>>(new Set());
  const [selectedCampaigns, setSelectedCampaigns] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/outreach/campaigns')
      .then(res => setCampaigns(res.data.data))
      .catch(console.error);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setAnalysis(null);
      setSuspects([]);
    };
    reader.readAsDataURL(file);
  };

  const startScan = async () => {
    if (!image) return;
    
    setIsScanning(true);
    toast.loading('Analyse biométrique et de contexte en cours...', { id: 'osint-scan' });

    try {
      const response = await api.post('/outreach/osint-scan', { imageBase64: image, deepScan: useDeepScan });
      const { data } = response.data;
      
      setAnalysis(data.analysis);
      setSuspects(data.suspects);
      toast.success('Analyse terminée !', { id: 'osint-scan' });
    } catch (error: any) {
      console.error('OSINT Scan failed:', error);
      toast.error('Échec de l\'analyse: ' + (error.response?.data?.error || error.message), { id: 'osint-scan' });
    } finally {
      setIsScanning(false);
    }
  };

  const enrichProfile = async (url: string) => {
    setEnrichingUrls(prev => new Set(prev).add(url));
    toast.loading('Extraction du CV en cours...', { id: 'enrich-' + url });

    try {
      const response = await api.post('/outreach/enrich-profile', { profileUrl: url });
      setEnrichedProfiles(prev => ({ ...prev, [url]: response.data.data }));
      toast.success('CV extrait avec succès !', { id: 'enrich-' + url });
    } catch (error: any) {
      console.error('Enrichment failed:', error);
      toast.error('Échec de l\'extraction', { id: 'enrich-' + url });
    } finally {
      setEnrichingUrls(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  const generateDossier = async (url: string, profile: EnrichedProfileData) => {
    setGeneratingDossiers(prev => new Set(prev).add(url));
    toast.loading('Génération du Dossier d\'Investigation en cours...', { id: 'dossier-' + url });

    try {
      const company = profile.experiences?.[0]?.company || profile.headline || 'Unknown Company';
      const response = await api.post('/outreach/deep-dossier', { 
        name: profile.name,
        company: company
      });
      setDossiers(prev => ({ ...prev, [url]: response.data.data }));
      toast.success('Dossier généré !', { id: 'dossier-' + url });
    } catch (error: any) {
      console.error('Dossier generation failed:', error);
      toast.error('Échec de la génération', { id: 'dossier-' + url });
    } finally {
      setGeneratingDossiers(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  const generateIcebreaker = async (url: string, profile: EnrichedProfileData) => {
    setGeneratingEmpathy(prev => new Set(prev).add(url));
    toast.loading('Analyse psychométrique en cours...', { id: 'empathy-' + url });

    try {
      const company = profile.experiences?.[0]?.company || profile.headline || 'Unknown Company';
      const targetId = `${profile.name.toLowerCase().replace(/\s+/g, '_')}_${company.toLowerCase().replace(/\s+/g, '_')}`;
      
      const response = await api.post('/outreach/generate-icebreaker', { 
        targetId,
        goal: 'Proposer une prise de contact sur LinkedIn en douceur'
      });
      setEmpathyAnalyses(prev => ({ ...prev, [url]: response.data.data }));
      toast.success('Icebreakers générés !', { id: 'empathy-' + url });
    } catch (error: any) {
      console.error('Icebreaker generation failed:', error);
      toast.error('Échec de la génération', { id: 'empathy-' + url });
    } finally {
      setGeneratingEmpathy(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  const findContactData = async (url: string, profile: EnrichedProfileData) => {
    setFindingContacts(prev => new Set(prev).add(url));
    toast.loading('Recherche du contact en cascade (Waterfall)...', { id: 'contact-' + url });

    try {
      const company = profile.experiences?.[0]?.company || profile.headline || 'Unknown Company';
      
      const response = await api.post('/outreach/find-contact', { 
        name: profile.name,
        company: company
      });
      setContacts(prev => ({ ...prev, [url]: response.data.data }));
      toast.success('Contact trouvé !', { id: 'contact-' + url });
    } catch (error: any) {
      console.error('Contact finding failed:', error);
      toast.error('Échec de la recherche de contact', { id: 'contact-' + url });
    } finally {
      setFindingContacts(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  const addToCampaign = async (url: string, profile: EnrichedProfileData, icebreaker: string) => {
    const campaignId = selectedCampaigns[url];
    if (!campaignId) {
      toast.error('Veuillez sélectionner une campagne');
      return;
    }

    setAddingToCampaign(prev => new Set(prev).add(url));
    toast.loading('Ajout à la campagne...', { id: 'add-campaign-' + url });

    try {
      await api.post('/outreach/add-from-osint', { 
        campaignId,
        name: profile.name,
        headline: profile.headline,
        profileUrl: url,
        icebreaker
      });
      toast.success('Prospect ajouté à la campagne !', { id: 'add-campaign-' + url });
    } catch (error: any) {
      console.error('Failed to add to campaign:', error);
      toast.error('Échec de l\'ajout', { id: 'add-campaign-' + url });
    } finally {
      setAddingToCampaign(prev => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-6 rounded-xl">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <ScanLine className="w-5 h-5 text-brand-500" />
          Scanner OSINT (Open Source Intelligence)
        </h2>
        <p className="text-muted-foreground mb-6">
          Uploadez une photo prise lors d'un salon ou d'une conférence. Notre IA Vision analysera les badges, les logos et l'environnement pour déduire l'identité de la personne et lancer une recherche ciblée sur le web (LinkedIn).
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <ProfileScanner 
            image={image}
            isScanning={isScanning}
            useDeepScan={useDeepScan}
            hasAnalysis={!!analysis}
            onImageUpload={handleImageUpload}
            onClearImage={() => { setImage(null); setAnalysis(null); setSuspects([]); }}
            onScan={startScan}
            onDeepScanChange={setUseDeepScan}
          />

          <div className="space-y-6">
            {isScanning ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <ScanLine className="w-12 h-12 text-brand-500 animate-pulse" />
                <p className="animate-pulse">Extraction des indices visuels en cours...</p>
              </div>
            ) : analysis ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-3">Contexte Extrait (Vision IA)</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Textes détectés :</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {analysis.extractedText.length > 0 ? analysis.extractedText.map((t, i) => (
                          <span key={i} className="text-xs bg-background border border-border px-2 py-1 rounded-md">{t}</span>
                        )) : <span className="text-sm text-muted-foreground italic">Aucun texte lisible</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Environnement / Profil :</span>
                      <p className="text-sm mt-1">{analysis.estimatedProfession}</p>
                    </div>
                    {analysis.companyOrEvent && (
                      <div>
                        <span className="text-sm font-medium">Entreprise / Événement suspecté :</span>
                        <p className="text-sm mt-1 font-semibold text-brand-600 dark:text-brand-400">{analysis.companyOrEvent}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> Profils Potentiels Trouvés ({suspects.length})
                  </h3>
                  
                  {suspects.length === 0 ? (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">Aucun résultat probant trouvé sur le web à partir de ces indices.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {suspects.map((suspect, idx) => {
                        const isLinkedIn = suspect.url.includes('linkedin.com');
                        const isEnriching = enrichingUrls.has(suspect.url);
                        const enrichedData = enrichedProfiles[suspect.url];

                        return (
                          <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden hover:border-brand-500 transition-all">
                            <a 
                              href={suspect.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block p-4 group"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${isLinkedIn ? 'bg-[#0A66C2]/10 text-[#0A66C2]' : 'bg-muted'}`}>
                                  {isLinkedIn ? <Linkedin className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm group-hover:text-brand-600 transition-colors line-clamp-1">{suspect.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{suspect.content}</p>
                                </div>
                              </div>
                            </a>
                            
                            {isLinkedIn && !enrichedData && (
                              <div className="px-4 pb-4 pt-1">
                                <button
                                  onClick={() => enrichProfile(suspect.url)}
                                  disabled={isEnriching}
                                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
                                >
                                  {isEnriching ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                      <ScanLine className="w-3 h-3" />
                                    </motion.div>
                                  ) : (
                                    <BrainCircuit className="w-3 h-3 text-brand-500" />
                                  )}
                                  {isEnriching ? 'Extraction en cours...' : '🧠 Extraire le CV (Enrichir)'}
                                </button>
                              </div>
                            )}

                            {enrichedData && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-4 pb-4 border-t border-border bg-muted/20">
                                <div className="pt-4 space-y-4">
                                  {enrichedData.experiences?.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-2">
                                        <FileText className="w-3 h-3" /> EXPÉRIENCE
                                      </h5>
                                      <div className="space-y-3">
                                        {enrichedData.experiences.map((exp, i) => (
                                          <div key={i} className="pl-3 border-l-2 border-brand-500/30">
                                            <p className="text-sm font-semibold">{exp.title}</p>
                                            <p className="text-xs font-medium text-muted-foreground">{exp.company} • {exp.duration}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {enrichedData.education?.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-2">
                                        <FileText className="w-3 h-3" /> FORMATION
                                      </h5>
                                      <div className="space-y-2">
                                        {enrichedData.education.map((edu, i) => (
                                          <div key={i} className="pl-3 border-l-2 border-brand-500/30">
                                            <p className="text-sm font-semibold">{edu.school}</p>
                                            <p className="text-xs font-medium text-muted-foreground">{edu.degree} • {edu.duration}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {!contacts[suspect.url] ? (
                                    <div className="pt-2">
                                      <button
                                        onClick={() => findContactData(suspect.url, enrichedData)}
                                        disabled={findingContacts.has(suspect.url)}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50 border border-amber-500/20"
                                      >
                                        {findingContacts.has(suspect.url) ? (
                                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                            <ScanLine className="w-4 h-4" />
                                          </motion.div>
                                        ) : (
                                          <Search className="w-4 h-4" />
                                        )}
                                        {findingContacts.has(suspect.url) ? 'Exploit furtif en cours...' : '🎯 Trouver & Vérifier l\'Email (Waterfall + Exploit)'}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="mt-4 p-4 rounded-lg border bg-card/50 flex flex-col gap-2">
                                      <h5 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                                        <Search className="w-3 h-3" /> COORDONNÉES DÉTECTÉES
                                      </h5>
                                      {contacts[suspect.url].email ? (
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm">{contacts[suspect.url].email}</span>
                                            {contacts[suspect.url].isVerified ? (
                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">VÉRIFIÉ (100%)</span>
                                            ) : (
                                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">PROBABILISTE</span>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-muted-foreground">via {contacts[suspect.url].method}</span>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground italic">Aucun email trouvé.</p>
                                      )}
                                    </div>
                                  )}

                                  {!dossiers[suspect.url] ? (
                                    <div className="pt-2">
                                      <button
                                        onClick={() => generateDossier(suspect.url, enrichedData)}
                                        disabled={generatingDossiers.has(suspect.url)}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                      >
                                        {generatingDossiers.has(suspect.url) ? (
                                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                            <ScanLine className="w-4 h-4" />
                                          </motion.div>
                                        ) : (
                                          <Search className="w-4 h-4" />
                                        )}
                                        {generatingDossiers.has(suspect.url) ? 'Génération du dossier...' : '🕵️‍♂️ Générer un Dossier d\'Investigation Complet'}
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <DossierViewer dossierContent={dossiers[suspect.url]} />

                                      {!empathyAnalyses[suspect.url] ? (
                                        <div className="pt-6">
                                          <button
                                            onClick={() => generateIcebreaker(suspect.url, enrichedData)}
                                            disabled={generatingEmpathy.has(suspect.url)}
                                            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
                                          >
                                            {generatingEmpathy.has(suspect.url) ? (
                                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                                <BrainCircuit className="w-4 h-4" />
                                              </motion.div>
                                            ) : (
                                              <User className="w-4 h-4" />
                                            )}
                                            {generatingEmpathy.has(suspect.url) ? 'Analyse en cours...' : '💬 Générer un Icebreaker Hyper-Personnalisé'}
                                          </button>
                                        </div>
                                      ) : (
                                        <IcebreakerList 
                                          suspectUrl={suspect.url}
                                          empathyAnalysis={empathyAnalyses[suspect.url]}
                                          campaigns={campaigns}
                                          selectedCampaign={selectedCampaigns[suspect.url] || ''}
                                          onCampaignSelect={(url, campaignId) => setSelectedCampaigns(prev => ({ ...prev, [url]: campaignId }))}
                                          onAdd={(ice) => addToCampaign(suspect.url, enrichedData, ice)}
                                          isAdding={addingToCampaign.has(suspect.url)}
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl min-h-[300px]">
                <p>Prêt pour le scan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
