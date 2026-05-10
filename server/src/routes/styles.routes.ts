import { Router } from 'express';
import { createStyleSchema, generateInStyleSchema } from '@postcommander/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireFeature } from '../middleware/plan-limiter.js';
import {
  listStyles,
  handleCreateStyle,
  getStyleById,
  handleDeleteStyle,
  handleGenerateInStyle,
} from '../controllers/styles.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireFeature('styles'), listStyles);
router.post('/', requireFeature('styles'), validate(createStyleSchema), handleCreateStyle);
router.get('/:id', requireFeature('styles'), getStyleById);
router.delete('/:id', requireFeature('styles'), handleDeleteStyle);
router.post(
  '/:id/generate',
  requireFeature('styles'),
  validate(generateInStyleSchema),
  handleGenerateInStyle,
);

export default router;
