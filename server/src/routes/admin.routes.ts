import { Router } from 'express';
import { deletedAccountsQuerySchema } from '@postcommander/shared';
import { authMiddleware } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { validateQuery } from '../middleware/validate.js';
import { listDeletedAccounts } from '../controllers/admin.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/deleted-accounts', validateQuery(deletedAccountsQuerySchema), listDeletedAccounts);

export default router;
