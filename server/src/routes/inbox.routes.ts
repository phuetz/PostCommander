import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getInbox, resolveConversation, replyToComment } from '../controllers/inbox.controller.js';
import { inboxReplySchema, emptyBodySchema } from '../schemas/routes.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getInbox);
router.patch('/:id/resolve', validate(emptyBodySchema), resolveConversation);
router.post('/:id/reply', validate(inboxReplySchema), replyToComment);

export default router;
