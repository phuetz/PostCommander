import type { Request, Response } from 'express';
import { type ApiResponse, type GenerateResponse } from '@postcommander/shared';
import { generatePost, streamPost } from '../services/llm/index.js';
import { generateVideoScript } from '../services/llm/video.js';
import { catchAsync } from '../utils/catch-async.js';
import { AppError } from '../middleware/error-handler.js';
import { requireRequestUser } from '../utils/request-user.js';

/**
 * POST /api/generate
 * Generate a social media post using the specified LLM (JSON response).
 */
export const handleGenerate = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const result = await generatePost(req.body, requestUser.id);

  const response: ApiResponse<GenerateResponse> = {
    success: true,
    data: result,
  };

  res.json(response);
});

/**
 * POST /api/generate/stream
 * Generate a social media post with Server-Sent Events streaming.
 */
export const handleStreamGenerate = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Flush headers immediately
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await streamPost(req.body, requestUser.id, (chunk) => {
      switch (chunk.type) {
        case 'text-delta':
          sendEvent('text-delta', { content: chunk.content });
          break;
        case 'platform-variant':
          sendEvent('platform-variant', {
            platform: chunk.platform,
            content: chunk.content,
          });
          break;
        case 'hashtags':
          sendEvent('hashtags', { hashtags: chunk.hashtags });
          break;
        case 'agent-status':
          sendEvent('agent-status', { content: chunk.content });
          break;
        case 'error':
          sendEvent('error', { error: chunk.error });
          break;
      }
    });

    sendEvent('done', { result });
    res.end();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown stream error';
    // If headers already sent, send error as SSE event
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    } else {
      throw new AppError(500, `Stream generation failed: ${errorMessage}`);
    }
  }
});

/**
 * POST /api/generate/video-script
 */
export const handleVideoScriptGenerate = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const result = await generateVideoScript(req.body, requestUser.id);

  const response = {
    success: true,
    data: result,
  };

  res.json(response);
});

/**
 * POST /api/generate/blog-article
 */
export const handleBlogArticleGenerate = catchAsync(async (req: Request, res: Response) => {
  const requestUser = requireRequestUser(req);
  const { generateBlogArticle } = await import('../services/llm/index.js');
  const result = await generateBlogArticle(req.body, requestUser.id);

  res.json({
    success: true,
    data: result,
  });
});
