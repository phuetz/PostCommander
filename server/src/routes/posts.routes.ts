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
} from '../controllers/posts.controller.js';
import {
  createPostSchema,
  updatePostSchema,
  listPostsQuerySchema,
  publishPostSchema,
  schedulePostSchema,
} from '@postcommander/shared';

const router = Router();

router.use(authMiddleware);

router.get('/', validateQuery(listPostsQuerySchema), listPosts);
router.get('/:id', getPostById);
router.post('/', validate(createPostSchema), createPost);
router.put('/:id', validate(updatePostSchema), updatePost);
router.delete('/:id', deletePost);
router.post('/:id/publish', validate(publishPostSchema), publishPost);
router.post('/:id/schedule', validate(schedulePostSchema), schedulePost);

router.get('/:id/comments', getPostComments);
router.post('/:id/comments', addPostComment);
router.patch('/:id/status', updatePostStatus);

export default router;
