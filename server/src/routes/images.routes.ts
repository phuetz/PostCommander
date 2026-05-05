import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { authMiddleware } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { requireFeature } from '../middleware/plan-limiter.js';
import {
  generateImageSchema,
  listImagesQuerySchema,
  updateImageSchema,
} from '@postcommander/shared';
import {
  handleGenerateImage,
  handleListImages,
  handleUpdateImage,
} from '../controllers/images.controller.js';
import { IMAGES_DIR } from '../services/images/index.js';

const router = Router();

// ── Public route: serves stored image files. Must be UNAUTHENTICATED so that
// social-platform fetchers (Instagram, Facebook, Pinterest) can GET them.
// Security comes from the unguessable UUID filename, not session auth.
router.get('/file/:filename', (req, res) => {
  const { filename } = req.params;
  // Only allow simple uuid.ext shapes — no path traversal.
  if (!/^[a-zA-Z0-9-]+\.(png|jpe?g|webp|gif)$/.test(filename)) {
    return res.status(400).json({ success: false, error: 'Invalid filename' });
  }
  const filepath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ success: false, error: 'Image not found' });
  }
  return res.sendFile(filepath, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
});

// ── Authenticated routes ────────────────────────────────────────────
router.use(authMiddleware);

router.post('/generate', requireFeature('images'), validate(generateImageSchema), handleGenerateImage);
router.get('/', requireFeature('images'), validateQuery(listImagesQuerySchema), handleListImages);
router.patch('/:id', validate(updateImageSchema), handleUpdateImage);

export default router;
