import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
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
router.post('/campaigns', handleCreateCampaign);
router.put('/campaigns/:id', handleUpdateCampaign);
router.delete('/campaigns/:id', handleDeleteCampaign);
router.get('/campaigns/:id/prospects', handleGetCampaignProspects);
router.post('/prospects/:id/simulate-reply', handleSimulateReply);
router.post('/osint-scan', handleOSINTScan);
router.post('/enrich-profile', handleEnrichProfile);
router.post('/deep-dossier', handleDeepDossier);
router.post('/generate-icebreaker', handleGenerateIcebreaker);
router.post('/find-contact', handleFindContact);
router.post('/add-from-osint', handleAddFromOSINT);

export const outreachRoutes = router;
