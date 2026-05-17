import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getInbox, resolveConversation, replyToComment } from '../controllers/inbox.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getInbox);
router.patch('/:id/resolve', resolveConversation);
router.post('/:id/reply', replyToComment);

export default router;
