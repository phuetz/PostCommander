import { Router } from 'express';
import { templateQuerySchema, generateFromTemplateSchema } from '@postcommander/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { requireFeature } from '../middleware/plan-limiter.js';
import {
  listTemplates,
  getTemplateById,
  generateFromTemplate,
} from '../controllers/templates.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireFeature('templates'), validateQuery(templateQuerySchema), listTemplates);
router.get('/:id', requireFeature('templates'), getTemplateById);
router.post(
  '/:id/generate',
  requireFeature('templates'),
  validate(generateFromTemplateSchema),
  generateFromTemplate,
);

export default router;
