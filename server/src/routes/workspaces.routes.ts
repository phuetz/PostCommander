import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { handleGetWorkspaces, getWorkspaceMembers, inviteMember, removeMember } from '../controllers/workspaces.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', handleGetWorkspaces);
router.get('/:id/members', getWorkspaceMembers);
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
