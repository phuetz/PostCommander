import { searchWeb } from '../web-search.js';
import { logger } from '../../utils/logger.js';
import { liveActivity } from '../live-activity.js';

export async function pivotUsername(name: string, company: string): Promise<string> {
  await liveActivity.broadcast('outreach', `🕵️‍♂️ Username Pivoting: Traque cross-plateforme pour ${name}...`);

  // Simple username generation strategy
  const first = name.split(' ')[0]?.toLowerCase() || '';
  const last = name.split(' ').slice(1).join('').toLowerCase() || '';
  const usernames = [
    `${first}${last}`,
    `${first}_${last}`,
    `${first[0]}${last}`,
    `${last}${first}`,
  ];

  await liveActivity.broadcast('outreach', `Recherche de pseudonymes potentiels: ${usernames.join(', ')}...`);

  const results = [];
  // For each username, search specific sites
  for (const username of usernames.slice(0, 2)) { // Limit to 2 most likely to save time/API
    const query = `inurl:${username} site:twitter.com OR site:github.com OR site:reddit.com OR site:medium.com "${company}"`;
    const searchRes = await searchWeb(query, 2);
    results.push(...searchRes);
  }

  if (results.length === 0) {
    return "Aucune empreinte alternative trouvée sous les pseudonymes courants.";
  }

  const summary = results.map(r => `- Profil possible trouvé sur ${r.url}: ${r.title}`).join('\n');
  return `### 🕵️‍♂️ Empreintes Alternatives (Username Pivoting)\n${summary}`;
}
