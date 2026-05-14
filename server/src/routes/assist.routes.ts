import { Router } from 'express';
import { assistFieldRequestSchema } from '@postcommander/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateRateLimit } from '../middleware/rate-limits.js';
import { handleAssistField } from '../controllers/assist.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(generateRateLimit);

router.post('/field', validate(assistFieldRequestSchema), handleAssistField);

export default router;
