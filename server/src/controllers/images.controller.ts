import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catch-async.js';
import { generateImage, listImages, updateImagePostLink } from '../services/images/index.js';
import { requireRequestUser } from '../utils/request-user.js';
import { AppError } from '../middleware/error-handler.js';

/**
 * POST /api/images/generate
 */
export const handleGenerateImage = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const { prompt, provider, postId } = req.body;
  const image = await generateImage(requestUser.id, prompt, provider, postId);
  res.status(201).json({ success: true, data: image });
});

/**
 * GET /api/images
 */
export const handleListImages = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const query = (req.validatedQuery as { postId?: string } | undefined) ?? {};
  const images = await listImages(requestUser.id, query.postId);
  res.json({ success: true, data: images });
});

/**
 * PATCH /api/images/:id
 * Update mutable fields on an image. Currently only postId (attach/detach).
 */
export const handleUpdateImage = catchAsync(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const requestUser = requireRequestUser(req);
  const { id } = req.params as { id: string };
  const body = req.body as { postId?: string | null };
  const postId = body.postId === undefined ? null : body.postId;
  try {
    const image = await updateImagePostLink(requestUser.id, id, postId);
    res.json({ success: true, data: image });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    if (message === 'Image not found') {
      throw new AppError(404, message);
    }
    throw err;
  }
});
