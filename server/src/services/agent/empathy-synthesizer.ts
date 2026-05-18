import { generateObject } from 'ai';
import { z } from 'zod';
import { createModel } from '../llm/provider-factory.js';
import { memoryService } from '../memory/memory.service.js';
import { logger } from '../../utils/logger.js';
import { liveActivity } from '../live-activity.js';

export interface EmpathyAnalysis {
  personaType: string;
  psychometricProfile: string;
  recommendedTone: string;
  icebreakers: string[];
}

export async function generateEmpathicIcebreaker(targetId: string, goal: string = "Proposer une prise de contact professionnelle sur LinkedIn"): Promise<EmpathyAnalysis> {
  await liveActivity.broadcast('outreach', `🧠 Démarrage du Synthétiseur d'Empathie pour ${targetId}...`);

  // 1. Recall memory context
  await liveActivity.broadcast('outreach', `Consultation de l'hippocampe (Mem0) pour récupérer le contexte OSINT...`);
  const context = await memoryService.recall(targetId, "What is the full professional background, interests, and latest news about this person?", 5);

  if (context === 'No context available.' || context === 'No context available due to error.') {
    logger.warn(`[Empathy] No memory found for ${targetId}`);
    // We can still proceed but with a warning.
  }

  await liveActivity.broadcast('outreach', `Analyse psychométrique (DISC/Big Five) en cours d'après l'empreinte digitale...`);

  const systemPrompt = `Tu es un expert mondial en psychologie comportementale, spécialisé dans l'approche B2B et l'ingénierie sociale bienveillante.
Ta mission est d'analyser le contexte d'une personne (récupéré depuis notre base OSINT) pour déduire sa personnalité (méthode DISC ou Big Five), son style de communication, et proposer les meilleures phrases d'accroches (Icebreakers) pour l'approcher.

Objectif de l'approche : ${goal}

Voici tout ce que nous savons sur la cible (Mémoire Long Terme) :
${context}

Analyse ces données pour générer un profil psychologique précis et proposer 3 Icebreakers ultra-personnalisés. L'Icebreaker parfait ne vend rien, il crée une connexion humaine basée sur un point commun ou un détail subtil trouvé dans l'OSINT.`;

  const model = await createModel('openai', 'gpt-4o');
  
  const schema = z.object({
    personaType: z.string().describe("Le type de Persona (ex: 'Le Bâtisseur Pragmatique', 'L'Innovateur Extraverti')"),
    psychometricProfile: z.string().describe("Analyse courte du profil psychologique (ex: Dominant, Analytique, etc.) et ce qui motive cette personne."),
    recommendedTone: z.string().describe("Le ton exact à employer avec lui/elle (ex: 'Direct, sans jargon, axé sur les résultats et le gain de temps')."),
    icebreakers: z.array(z.string()).describe("3 propositions d'Icebreakers prêts à être envoyés. De plus en plus créatifs.")
  });

  const { object } = await generateObject({
    model,
    schema,
    messages: [{ role: 'system', content: systemPrompt }]
  });

  await liveActivity.broadcast('outreach', `✅ Profil psychologique de ${object.personaType} identifié. Accroches générées.`, 'success');

  // Memorize this analysis so the agent remembers the best tone for future chats
  await memoryService.memorize(targetId, `Psychological Profile: ${object.personaType}. Recommended communication tone: ${object.recommendedTone}`, { type: 'psychometric_analysis' });

  return object as EmpathyAnalysis;
}
