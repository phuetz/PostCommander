import { generateText } from 'ai';
import { createModel } from './provider-factory.js';
import type { LLMProviderId } from '@postcommander/shared';

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

function parseJsonResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

export async function generateVideoScript(
  params: GenerateVideoScriptParams,
  userId?: string,
): Promise<VideoScriptResult> {
  const model = createModel(params.provider as LLMProviderId, params.model, userId);

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

  const user = `Topic / Idea: ${params.topic}`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.7,
    maxTokens: 2000,
  });

  return parseJsonResponse(result.text) as VideoScriptResult;
}
