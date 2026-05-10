import { Router } from 'express';
import {
  handleGetConfigs,
  handleCreateConfig,
  handleUpdateConfig,
  handleDeleteConfig,
} from '../controllers/autoblog.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { autoBlogConfigSchema, updateAutoBlogConfigSchema } from '@postcommander/shared';

const router = Router();

router.use(authMiddleware);

router.get('/', handleGetConfigs);
router.post('/', validate(autoBlogConfigSchema), handleCreateConfig);
router.put('/:id', validate(updateAutoBlogConfigSchema), handleUpdateConfig);
router.delete('/:id', handleDeleteConfig);

export default router;
