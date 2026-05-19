import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  schedulePost,
  getPostComments,
  addPostComment,
  updatePostStatus,
  repurposeUrl,
  approvePost,
  rejectPost,
} from '../controllers/posts.controller.js';
import {
  createPostSchema,
  updatePostSchema,
  listPostsQuerySchema,
  publishPostSchema,
  schedulePostSchema,
  repurposeUrlSchema,
} from '@postcommander/shared';
import {
  emptyBodySchema,
  postCommentBodySchema,
  postStatusUpdateSchema,
  postRejectSchema,
} from '../schemas/routes.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(listPostsQuerySchema), listPosts);
router.get('/:id', getPostById);
router.post('/', validate(createPostSchema), createPost);
router.put('/:id', validate(updatePostSchema), updatePost);
router.delete('/:id', validate(emptyBodySchema), deletePost);
router.post('/:id/publish', validate(publishPostSchema), publishPost);
router.post('/:id/schedule', validate(schedulePostSchema), schedulePost);

router.get('/:id/comments', getPostComments);
router.post('/:id/comments', validate(postCommentBodySchema), addPostComment);
router.patch('/:id/status', validate(postStatusUpdateSchema), updatePostStatus);
router.post('/:id/approve', validate(emptyBodySchema), approvePost);
router.post('/:id/reject', validate(postRejectSchema), rejectPost);
router.post('/repurpose-url', validate(repurposeUrlSchema), repurposeUrl);

export default router;
