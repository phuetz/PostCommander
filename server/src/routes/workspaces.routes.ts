import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { handleGetWorkspaces, getWorkspaceMembers, inviteMember, removeMember } from '../controllers/workspaces.controller.js';
import { workspaceInviteSchema, emptyBodySchema } from '../schemas/routes.js';

const router = Router();

router.use(authMiddleware);

router.get('/', handleGetWorkspaces);
router.get('/:id/members', getWorkspaceMembers);
router.post('/:id/invite', validate(workspaceInviteSchema), inviteMember);
router.delete('/:id/members/:userId', validate(emptyBodySchema), removeMember);

export default router;
