import type { LLMProviderId } from '@postcommander/shared';
import { runLLM, parseJsonResponse } from './_runtime.js';

export interface GenerateVideoScriptParams {
  topic: string;
  duration: 'short' | 'medium' | 'long';
  platform: 'tiktok' | 'reels' | 'shorts';
  tone: string;
  provider: string;
  model: string;
}

export interface VideoScriptPart {
  duration: string;
  visual: string;
  audio: string;
  script: string;
}

export interface VideoScriptResult {
  title: string;
  hook: string;
  parts: VideoScriptPart[];
  cta: string;
  caption: string;
  hashtags: string[];
}

export async function generateVideoScript(
  params: GenerateVideoScriptParams,
  userId?: string,
): Promise<VideoScriptResult> {
  const durationStr =
    params.duration === 'short'
      ? '15-30 seconds'
      : params.duration === 'medium'
        ? '30-60 seconds'
        : '1-3 minutes';

  const system = `You are an expert video producer and social media strategist specializing in short-form vertical video (${params.platform}).
Your job is to write an engaging video script that maximizes retention and engagement.

## Requirements:
- Platform: ${params.platform}
- Target Duration: ${durationStr}
- Tone: ${params.tone}

## JSON Format Required:
You MUST respond in valid JSON with exactly this structure:
{
  "title": "Internal title for the video idea",
  "hook": "The first 3 seconds to grab attention",
  "parts": [
    {
      "duration": "0:00-0:03",
      "visual": "What is shown on screen (camera angle, text overlay, b-roll)",
      "audio": "Music style, sound effects, or specific tone of voice",
      "script": "The exact words spoken by the creator"
    }
  ],
  "cta": "Call to action at the end",
  "caption": "The text caption to put in the post description",
  "hashtags": ["#tag1", "#tag2"]
}`;

  const { raw } = await runLLM({
    provider: params.provider as LLMProviderId,
    model: params.model,
    userId,
    system,
    user: `Topic / Idea: ${params.topic}`,
    temperature: 0.7,
    maxTokens: 2000,
  });

  return parseJsonResponse<VideoScriptResult>(raw);
}
