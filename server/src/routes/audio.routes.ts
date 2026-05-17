import { Router } from 'express';
import { z } from 'zod';
import { kokoroService } from '../services/ai/kokoro.service.js';
import { logger } from '../utils/logger.js';

export const audioRoutes = Router();

const generateAudioSchema = z.object({
  text: z.string().min(1).max(1000),
  voice: z.string().optional(),
});

audioRoutes.post('/synthesize', async (req, res) => {
  try {
    const { text, voice } = generateAudioSchema.parse(req.body);
    
    logger.info(`[AudioAPI] Request to synthesize text (length: ${text.length}, voice: ${voice || 'default'})`);
    
    const audioBuffer = await kokoroService.generateSpeech(text, voice);
    
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    res.status(200).send(audioBuffer);
  } catch (error: any) {
    logger.error({ err: error }, '[AudioAPI] Failed to synthesize audio');
    if (error instanceof z.ZodError) {
      res.status(400).json({ status: 'error', message: 'Invalid request payload', errors: error.errors });
    } else {
      res.status(500).json({ status: 'error', message: error.message || 'Internal Server Error' });
    }
  }
});
