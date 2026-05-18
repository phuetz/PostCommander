import { generateText } from 'ai';
import { createModel } from '../llm/provider-factory.js';
import { searchWeb } from '../web-search.js';
import { logger } from '../../utils/logger.js';
import { liveActivity } from '../live-activity.js';
import { pivotUsername } from './username-pivot.js';
import { detectIntentSignals } from './intent-tracker.js';

export async function generateDeepDossier(name: string, company: string): Promise<string> {
  await liveActivity.broadcast('outreach', `🕵️‍♂️ Initialisation de l'Agent Deep Dossier pour ${name} (${company})...`);

  // 1. Parallel Web Searches
  const queries = [
    `"${name}" "${company}" interview OR blog OR news`,
    `"${name}" "${company}" site:twitter.com OR site:github.com OR site:medium.com`,
    `email format "${company}" contact`
  ];

  await liveActivity.broadcast('outreach', `Lancement des requêtes OSINT multi-sources...`);
  
  const searchPromises = queries.map(q => searchWeb(q, 3));
  const results = await Promise.all(searchPromises);

  // Advanced Skills
  const pivotResults = await pivotUsername(name, company);
  const intentResults = await detectIntentSignals(company);

  const flatResults = results.flat().map(r => `Source: ${r.title}\nURL: ${r.url}\nExtrait: ${r.content}`).join('\n\n');
  const enrichedResults = `${flatResults}\n\n${pivotResults}\n\n${intentResults}`;

  await liveActivity.broadcast('outreach', `Agrégation des données et analyse psychologique en cours...`);

  const systemPrompt = `Tu es un expert en OSINT et un Growth Hacker d'élite.
Ton objectif est de rédiger un "Dossier de Renseignement" ultra-structuré sur une personne pour aider un commercial B2B à rédiger l'approche parfaite (Icebreaker).

Identité cible : ${name} chez ${company}

Voici les données brutes extraites du web :
${enrichedResults}

Rédige un rapport avec la structure suivante :
## 🌐 Empreinte Digitale & Actualité
(Résume ses apparitions, articles, interviews ou sujets de prédilection trouvés sur le web. Si rien n'est trouvé, sois honnête).

## 🔗 Réseaux Alternatifs & Passions
(Liste les autres plateformes où la personne semble active : Twitter, GitHub, etc., et déduis ses passions ou hobbies à partir du Username Pivoting).

## 🎯 Signaux d'Intention de l'Entreprise
(Résume les informations de recrutement ou stratégiques trouvées via le Google Dorking).

## 📧 Probabilité de Contact
(Essaie de déduire son email professionnel en te basant sur le format de l'entreprise s'il a été trouvé, ou propose des suggestions).

## 🎯 Angle d'Approche (Icebreaker)
(Génère 2 suggestions d'accroches ultra-personnalisées pour LinkedIn ou Email en te basant sur l'ensemble de son profil).

Sois concis, professionnel et percutant. Utilise un format Markdown lisible. Ne mentionne pas que tu es une IA.`;

  const model = await createModel('openai', 'gpt-4o');
  
  const { text } = await generateText({
    model,
    messages: [{ role: 'system', content: systemPrompt }]
  });

  await liveActivity.broadcast('outreach', `✅ Dossier d'investigation généré avec succès !`, 'success');

  return text;
}
