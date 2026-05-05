import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateSettingsSchema } from '@postcommander/shared';
import {
  getSettings,
  updateSettings,
} from '../controllers/settings.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', validate(updateSettingsSchema), updateSettings);

export default router;
