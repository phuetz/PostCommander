import { searchWeb } from '../web-search.js';
import { logger } from '../../utils/logger.js';
import { liveActivity } from '../live-activity.js';
import { Stagehand } from '@browserbasehq/stagehand';
import { config } from '../../config/env.js';

export interface ContactResult {
  email: string | null;
  phone: string | null;
  method: string;
  isVerified: boolean;
}

export async function findContact(name: string, company: string): Promise<ContactResult> {
  await liveActivity.broadcast('outreach', `🎯 Contact Finder: Démarrage de la séquence Waterfall pour ${name}...`);

  // Step 1: Free Web Search Fallback
  await liveActivity.broadcast('outreach', `Étape 1: Recherche gratuite des fuites de données (Google Dorking)...`);
  const dorkQuery = `"${name}" "${company}" email OR contact OR @${company.toLowerCase().replace(/\s+/g, '')}.com`;
  const searchResults = await searchWeb(dorkQuery, 2);
  
  const combinedText = searchResults.map(r => r.content).join(' ');
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const foundEmails = combinedText.match(emailRegex);

  let targetEmail = null;
  let method = 'Google Dorking';

  if (foundEmails && foundEmails.length > 0) {
    targetEmail = foundEmails[0];
    await liveActivity.broadcast('outreach', `Email potentiel trouvé publiquement: ${targetEmail}`);
  } else {
    // Step 2: Permutation Generation
    await liveActivity.broadcast('outreach', `Étape 2: Génération de permutations d'emails...`);
    const first = name.split(' ')[0]?.toLowerCase() || '';
    const last = name.split(' ').slice(1).join('').toLowerCase() || '';
    const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
    
    targetEmail = `${first}.${last}@${domain}`;
    method = 'Permutation Guessing';
    await liveActivity.broadcast('outreach', `Permutation la plus probable: ${targetEmail}`);
  }

  // Step 3: Password Reset Exploit via Stagehand
  await liveActivity.broadcast('outreach', `Étape 3: Vérification furtive (Password Reset Exploit) via Stagehand...`);
  
  let isVerified = false;
  let stagehand: Stagehand;

  if (config.BROWSERBASE_API_KEY && config.BROWSERBASE_PROJECT_ID) {
    const stagehandEnv = config.BROWSERBASE_API_KEY ? 'BROWSERBASE' : 'LOCAL';
    stagehand = new Stagehand({
      env: stagehandEnv,
      apiKey: config.BROWSERBASE_API_KEY,
      projectId: config.BROWSERBASE_PROJECT_ID,
      logger: (message: any) => logger.info(`[Stagehand Finder] ${message.message || JSON.stringify(message)}`),
    });

    try {
      await stagehand.init();
      const page = (stagehand.context.activePage() || await stagehand.context.newPage()) as any;
      
      try {
        // Anti-ban delay
        const delay = Math.floor(Math.random() * 3000) + 1500;
        await new Promise(r => setTimeout(r, delay));
        
        await page.goto('https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=4765445b-32c6-49b0-83e6-1d93765276ca&response_type=code&scope=openid', { waitUntil: 'domcontentloaded' });
        await stagehand.act(`Fill the email address input field with "${targetEmail}" and click the 'Next' button.`);
        
        const result = await (stagehand.extract as any)({
          instruction: "Extract the confirmation or error message displayed. Does the page ask for a password (success) or does it say 'account does not exist' or 'We couldn't find an account' (failure)?",
          schema: {
            message: "string",
            isSuccess: "boolean describing if the system accepted the email"
          }
        });
        
        if (result && (result as any).isSuccess) {
          isVerified = true;
          await liveActivity.broadcast('outreach', `✅ Email validé à 100% via Microsoft 365 !`, 'success');
        }
      } catch (e) {
        logger.debug('Microsoft check failed, falling back to Zoom');
      }

      // Fallback to Zoom if Microsoft fails or is unverified
      if (!isVerified) {
        try {
          // Anti-ban delay
          const delay = Math.floor(Math.random() * 4000) + 2000;
          await new Promise(r => setTimeout(r, delay));
          
          await page.goto('https://zoom.us/forgot_password', { waitUntil: 'domcontentloaded' });
          await stagehand.act(`Fill the email address input field with "${targetEmail}" and click the 'Send' or 'Submit' button.`);
          
          const resultZoom = await (stagehand.extract as any)({
            instruction: "Extract the confirmation or error message displayed on the page. Usually it says 'We have sent an email' or 'Account does not exist'.",
            schema: {
              message: "string",
              isSuccess: "boolean describing if the system accepted the email"
            }
          });

          if (resultZoom && (resultZoom as any).isSuccess) {
            isVerified = true;
            await liveActivity.broadcast('outreach', `✅ Email validé à 100% via Zoom !`, 'success');
          } else {
            await liveActivity.broadcast('outreach', `L'exploit n'a pas pu confirmer l'email. L'adresse est probabiliste.`);
          }
        } catch (error) {
          logger.error({ error }, 'Stagehand Contact Finder exploit failed on Zoom');
          await liveActivity.broadcast('outreach', `L'agent furtif a été bloqué. L'adresse reste probabiliste.`);
        }
      }

    } catch (error) {
      logger.error({ error }, 'Stagehand Contact Finder exploit failed');
      await liveActivity.broadcast('outreach', `L'agent furtif a été bloqué (Captcha potentiel). L'adresse reste probabiliste.`);
    } finally {
      await stagehand.close();
    }
  } else {
    await liveActivity.broadcast('outreach', `Configuration Browserbase absente. L'adresse reste probabiliste.`);
  }

  return {
    email: targetEmail,
    phone: null, // Phone finding could be added as another waterfall step
    method,
    isVerified
  };
}
