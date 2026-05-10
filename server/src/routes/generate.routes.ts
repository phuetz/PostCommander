import { Router } from 'express';
import {
  generateSchema,
  hooksSchema,
  carouselSchema,
  repurposeSchema,
  hashtagsSchema,
  abTestSchema,
  blogArticleSchema,
} from '@postcommander/shared';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkPostLimit, requireFeature } from '../middleware/plan-limiter.js';
import { generateRateLimit } from '../middleware/rate-limits.js';
import { handleGenerate, handleStreamGenerate } from '../controllers/generate.controller.js';
import {
  handleGenerateHooks,
  handleGenerateCarousel,
  handleRepurpose,
  handleResearchHashtags,
} from '../controllers/generate-extended.controller.js';
import { handleABTest } from '../controllers/ab-testing.controller.js';
import {
  handleVideoScriptGenerate,
  handleBlogArticleGenerate,
} from '../controllers/generate.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(generateRateLimit);

router.post('/', checkPostLimit(), validate(generateSchema), handleGenerate);
router.post('/stream', checkPostLimit(), validate(generateSchema), handleStreamGenerate);
router.post('/hooks', requireFeature('hooks'), validate(hooksSchema), handleGenerateHooks);
router.post(
  '/carousel',
  requireFeature('carousel'),
  validate(carouselSchema),
  handleGenerateCarousel,
);
router.post('/repurpose', requireFeature('repurpose'), validate(repurposeSchema), handleRepurpose);
router.post(
  '/hashtags',
  requireFeature('hashtags'),
  validate(hashtagsSchema),
  handleResearchHashtags,
);
router.post('/ab-test', requireFeature('ab_testing'), validate(abTestSchema), handleABTest);
router.post('/video-script', handleVideoScriptGenerate);
router.post('/blog-article', validate(blogArticleSchema), handleBlogArticleGenerate);

export default router;
