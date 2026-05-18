import { searchWeb } from '../web-search.js';
import { logger } from '../../utils/logger.js';
import { liveActivity } from '../live-activity.js';

export async function detectIntentSignals(company: string): Promise<string> {
  await liveActivity.broadcast('outreach', `🎯 Intent Tracker: Recherche de signaux faibles pour ${company}...`);

  // Google Dorks for finding recent job postings and strategic docs
  const queries = [
    `site:lever.co OR site:greenhouse.io OR site:boards.greenhouse.io "${company}"`,
    `filetype:pdf "internal use only" OR "strategic plan" "${company}"`
  ];

  const results = [];
  for (const query of queries) {
    const searchRes = await searchWeb(query, 2);
    results.push(...searchRes);
  }

  if (results.length === 0) {
    return "Aucun signal d'intention majeur détecté publiquement.";
  }

  const summary = results.map(r => `- [${r.title}](${r.url}): ${r.content.substring(0, 150)}...`).join('\n');
  return `### 🎯 Signaux d'Intention & Déclencheurs (Google Dorking)\n${summary}`;
}
