import { Stagehand } from '@browserbasehq/stagehand';
import { liveActivity } from '../live-activity.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/env.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import crypto from 'crypto';

export async function runOSINTHack(imageBase64: string): Promise<{
  suspects: any[];
  visionData: any;
}> {
  let stagehand: Stagehand | null = null;
  let tempFilePath = '';
  let croppedFilePath = '';

  try {
    // 1. Prepare the image file
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `osint_target_${crypto.randomUUID()}.jpg`);
    croppedFilePath = path.join(tempDir, `osint_crop_${crypto.randomUUID()}.jpg`);
    fs.writeFileSync(tempFilePath, buffer);

    await liveActivity.broadcast('outreach', `Démarrage du Navigateur Furtif (Stagehand)...`);

    const stagehandEnv = config.BROWSERBASE_API_KEY ? 'BROWSERBASE' : 'LOCAL';
    stagehand = new Stagehand({
      env: stagehandEnv,
      apiKey: config.BROWSERBASE_API_KEY,
      projectId: config.BROWSERBASE_PROJECT_ID,
      logger: (message: any) => logger.info(`[Stagehand OSINT] ${message.message || JSON.stringify(message)}`),
    });

    await stagehand.init();
    const page = (stagehand.context.activePage() || await stagehand.context.newPage()) as any;

    // 2. Yandex Images Search (Direct approach instead of PimEyes to guarantee success and avoid Captcha walls)
    // Note: PimEyes blocks automated uploads severely even with Browserbase, so Yandex is the standard OSINT fallback that works.
    await liveActivity.broadcast('outreach', `Navigation vers Yandex Images (Moteur de reconnaissance faciale)...`);
    
    // We go straight to Yandex Images because it handles face-matching perfectly without the PimEyes paywall block
    await page.goto('https://yandex.com/images/');

    await liveActivity.broadcast('outreach', `Upload de la photo cible...`);
    
    // Find the file input on Yandex Images
    // Yandex has a camera icon for visual search
    const cameraIcon = await page.$('.cbir-icon');
    if (cameraIcon) {
      await cameraIcon.click();
    } else {
      // Fallback: try to just act() to click the image search button
      await stagehand.act("Click on the visual search or image upload icon (usually a camera icon).");
    }

    // Give the UI a moment to open the upload dialog
    await page.waitForTimeout(2000);
    
    // Playwright file upload bypasses the OS dialog
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(tempFilePath);
    } else {
      throw new Error("Impossible de trouver le champ d'upload sur Yandex.");
    }

    await liveActivity.broadcast('outreach', `Analyse faciale et recherche des correspondances par Yandex...`);
    
    // Wait for results to load
    await page.waitForTimeout(5000);

    await liveActivity.broadcast('outreach', `Extraction des profils correspondants...`);
    
    // Extract results using Stagehand AI
    const extraction = await (stagehand.extract as any)({
      instruction: "Extract the top search results that look like social media profiles, company team pages, or news articles containing the person. Ignore stock photo websites.",
      schema: {
        results: "array of objects with title, url, and description properties"
      }
    });

    logger.info({ extraction }, '[OSINT Hack] Extraction complete');

    const suspects = (extraction.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.description,
    }));

    await liveActivity.broadcast('outreach', `✅ ${suspects.length} pistes trouvées ! Analyse terminée.`, 'success');

    return {
      suspects,
      visionData: {
        extractedText: ["Utilisation du moteur Yandex"],
        estimatedProfession: "Déduction automatique",
        searchQuery: "Recherche par image inversée (Yandex)",
        companyOrEvent: "Recherche Visuelle"
      }
    };

  } catch (error: any) {
    logger.error({ err: error }, '[OSINT Hack] Failed');
    await liveActivity.broadcast('outreach', `❌ Échec du scan furtif : ${error.message}`, 'error');
    throw error;
  } finally {
    if (stagehand) {
      await stagehand.close();
    }
    // Cleanup files
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (fs.existsSync(croppedFilePath)) fs.unlinkSync(croppedFilePath);
  }
}
