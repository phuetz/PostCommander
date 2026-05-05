import { Router } from 'express';
import {
  createPillarSchema,
  updatePillarSchema,
  createIdeaSchema,
  updateIdeaSchema,
  generateIdeasSchema,
} from '@postcommander/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireFeature } from '../middleware/plan-limiter.js';
import {
  handleListPillars,
  handleCreatePillar,
  handleUpdatePillar,
  handleDeletePillar,
  handleListIdeas,
  handleCreateIdea,
  handleGenerateIdeas,
  handleUpdateIdea,
  handleDeleteIdea,
  handleStrategyOverview,
} from '../controllers/pillars.controller.js';

const router = Router();

router.use(authMiddleware);

// Strategy overview (must be before /:id to avoid matching "strategy" as an id)
router.get('/strategy', requireFeature('pillars'), handleStrategyOverview);

// Pillar CRUD
router.get('/', requireFeature('pillars'), handleListPillars);
router.post('/', requireFeature('pillars'), validate(createPillarSchema), handleCreatePillar);
router.put('/:id', requireFeature('pillars'), validate(updatePillarSchema), handleUpdatePillar);
router.delete('/:id', requireFeature('pillars'), handleDeletePillar);

// Ideas for a pillar
router.get('/:id/ideas', requireFeature('pillars'), handleListIdeas);
router.post('/:id/ideas', requireFeature('pillars'), validate(createIdeaSchema), handleCreateIdea);
router.post('/:id/generate-ideas', requireFeature('pillars'), validate(generateIdeasSchema), handleGenerateIdeas);

// Individual idea management
router.put('/ideas/:ideaId', requireFeature('pillars'), validate(updateIdeaSchema), handleUpdateIdea);
router.delete('/ideas/:ideaId', requireFeature('pillars'), handleDeleteIdea);

export default router;
