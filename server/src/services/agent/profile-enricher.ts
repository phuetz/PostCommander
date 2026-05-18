import { Stagehand } from '@browserbasehq/stagehand';
import { liveActivity } from '../live-activity.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/env.js';

export interface EnrichedProfileData {
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

export async function extractLinkedInProfile(profileUrl: string): Promise<EnrichedProfileData> {
  let stagehand: Stagehand | null = null;

  try {
    await liveActivity.broadcast('outreach', `Démarrage de l'agent d'enrichissement pour ${profileUrl}...`);

    const stagehandEnv = config.BROWSERBASE_API_KEY ? 'BROWSERBASE' : 'LOCAL';
    stagehand = new Stagehand({
      env: stagehandEnv,
      apiKey: config.BROWSERBASE_API_KEY,
      projectId: config.BROWSERBASE_PROJECT_ID,
      logger: (message: any) => logger.info(`[Stagehand Enrich] ${message.message || JSON.stringify(message)}`),
    });

    await stagehand.init();
    const page = stagehand.context.activePage() || await stagehand.context.newPage();

    // Inject LinkedIn Session Cookie
    if (config.LINKEDIN_SESSION_COOKIE) {
      await stagehand.context.addCookies([{
        name: 'li_at',
        value: config.LINKEDIN_SESSION_COOKIE,
        url: 'https://www.linkedin.com',
        secure: true,
        httpOnly: true
      }]);
      await liveActivity.broadcast('outreach', `Connexion sécurisée établie (Session injectée)`);
    } else {
      logger.warn('[Stagehand Enrich] No LINKEDIN_SESSION_COOKIE found. Profile viewing may be limited by login walls.');
      await liveActivity.broadcast('outreach', `⚠️ Aucun cookie de session trouvé, l'extraction risque d'être bloquée par LinkedIn.`, 'error');
    }

    await liveActivity.broadcast('outreach', `Navigation vers le profil cible...`);
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
    
    // Scroll down to ensure experience and education sections are loaded
    await liveActivity.broadcast('outreach', `Défilement de la page pour charger l'intégralité du CV...`);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3);
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 1.5);
    });
    await page.waitForTimeout(1500);

    await liveActivity.broadcast('outreach', `Extraction intelligente des expériences professionnelles et de la formation...`);
    const extraction = await (stagehand.extract as any)({
      instruction: "Extract the person's professional profile data. Be extremely precise with job titles, companies, and dates. If a section doesn't exist, return an empty array.",
      schema: {
        name: "string describing full name of the person",
        headline: "string describing their current headline or tagline",
        location: "string describing location if visible",
        about: "string describing summary or about section content",
        experiences: "array of objects with title, company, duration, and description",
        education: "array of objects with school, degree, and duration"
      }
    });

    await liveActivity.broadcast('outreach', `✅ Profil de ${extraction.name} extrait avec succès !`, 'success');
    return extraction as EnrichedProfileData;

  } catch (error: any) {
    logger.error({ err: error, profileUrl }, '[Stagehand Enrich] Failed to extract profile');
    await liveActivity.broadcast('outreach', `❌ Échec de l'extraction : ${error.message}`, 'error');
    throw error;
  } finally {
    if (stagehand) {
      await stagehand.close();
    }
  }
}
