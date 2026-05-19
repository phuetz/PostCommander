import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  handleGetCampaigns,
  handleCreateCampaign,
  handleUpdateCampaign,
  handleDeleteCampaign,
  handleGetCampaignProspects,
  handleSimulateReply,
  handleOSINTScan,
  handleEnrichProfile,
  handleDeepDossier,
  handleGenerateIcebreaker,
  handleFindContact,
  handleAddFromOSINT,
} from '../controllers/outreach.controller.js';
import {
  outreachSimulateReplySchema,
  outreachOsintScanSchema,
  outreachEnrichProfileSchema,
  outreachDeepDossierSchema,
  outreachGenerateIcebreakerSchema,
  outreachFindContactSchema,
  outreachAddFromOsintSchema,
  emptyBodySchema,
} from '../schemas/routes.js';

const router = Router();

// All outreach routes require authentication and workspace scope
router.use(authMiddleware);
router.use((req, res, next) => {
  if (!req.workspaceId) {
    return res.status(403).json({ error: 'Workspace ID is required for outreach operations' });
  }
  next();
});

router.get('/campaigns', handleGetCampaigns);
// handleCreateCampaign/handleUpdateCampaign already call CreateOutreachCampaignSchema.parse()
// internally — leaving controller-side parse in place since they also handle nested `steps`.
router.post('/campaigns', handleCreateCampaign);
router.put('/campaigns/:id', handleUpdateCampaign);
router.delete('/campaigns/:id', validate(emptyBodySchema), handleDeleteCampaign);
router.get('/campaigns/:id/prospects', handleGetCampaignProspects);
router.post('/prospects/:id/simulate-reply', validate(outreachSimulateReplySchema), handleSimulateReply);
router.post('/osint-scan', validate(outreachOsintScanSchema), handleOSINTScan);
router.post('/enrich-profile', validate(outreachEnrichProfileSchema), handleEnrichProfile);
router.post('/deep-dossier', validate(outreachDeepDossierSchema), handleDeepDossier);
router.post('/generate-icebreaker', validate(outreachGenerateIcebreakerSchema), handleGenerateIcebreaker);
router.post('/find-contact', validate(outreachFindContactSchema), handleFindContact);
router.post('/add-from-osint', validate(outreachAddFromOsintSchema), handleAddFromOSINT);

export const outreachRoutes = router;
