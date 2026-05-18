import { generateText } from 'ai';
import { createModel } from './provider-factory.js';
import type { LLMProviderId } from '@postcommander/shared';

export interface GenerateCarouselRequest {
  topic: string;
  platform: string;
  tone: string;
  provider: LLMProviderId;
  model: string;
  slideCount?: number;
}

export interface CarouselSlide {
  slideNumber: number;
  title: string;
  body: string;
}

export interface GenerateCarouselResult {
  slides: CarouselSlide[];
  caption: string;
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

/**
 * Generate carousel/thread content for a topic and platform.
 */
export async function generateCarousel(
  request: GenerateCarouselRequest,
  userId?: string,
): Promise<GenerateCarouselResult> {
  const model = await createModel(request.provider, request.model, userId);
  const slideCount = request.slideCount ?? 7;

  let platformInstructions: string;

  switch (request.platform) {
    case 'linkedin':
      platformInstructions = `## LinkedIn Carousel Format
Generate a LinkedIn carousel document (PDF-style slides).

Structure:
- Slide 1: Title slide with a bold, attention-grabbing headline and subtitle
- Slides 2-${slideCount - 1}: Content slides, each with a clear title and 2-4 bullet points or a short paragraph
- Final slide: CTA slide with a call-to-action (follow, comment, share, save)

Design guidance for each slide:
- Title: 3-8 words, bold and punchy
- Body: 40-80 words per slide, easy to read
- Use numbers, frameworks, or step-by-step progressions
- Each slide should deliver one key insight
- Make it feel like a mini-course or playbook

Also generate a LinkedIn caption (200-400 words) that teases the carousel content and encourages engagement.`;
      break;

    case 'twitter':
      platformInstructions = `## Twitter/X Thread Format
Generate a Twitter thread of ${slideCount} tweets.

Structure:
- Tweet 1: Hook tweet that makes people want to read the whole thread. Must be compelling standalone.
- Tweets 2-${slideCount - 1}: Each tweet delivers one key point. Should work independently AND as part of the thread.
- Final tweet: Summary + CTA (like, retweet, follow for more)

Rules:
- Each tweet MUST be under 280 characters
- Use thread numbering (1/, 2/, etc.) in the title field
- The body field contains the actual tweet text
- No hashtags in the thread itself (put them in the caption)
- Use line breaks for readability
- One idea per tweet

Also generate a brief summary (1-2 sentences) as the caption.`;
      break;

    case 'instagram':
      platformInstructions = `## Instagram Carousel Format
Generate an Instagram carousel of ${slideCount} slides.

Structure:
- Slide 1: Cover slide with a headline that stops the scroll (like a magazine cover)
- Slides 2-${slideCount - 1}: Content slides with clear titles and concise text
- Final slide: CTA slide (save, share, follow)

Design guidance:
- Title: 2-6 words, designed to be large text on the slide
- Body: 15-40 words per slide (Instagram carousels are visual, text should be minimal)
- Use actionable tips, numbered lists, or before/after comparisons
- Each slide should be visually distinct and add value

Also generate an Instagram caption (150-300 words) with:
- A hook in the first line
- Value add or context
- Call to action
- 20-30 relevant hashtags`;
      break;

    default:
      platformInstructions = `## Generic Carousel/Multi-Part Format
Generate ${slideCount} content slides suitable for ${request.platform}.

Structure:
- Slide 1: Title/hook
- Slides 2-${slideCount - 1}: Core content, one point per slide
- Final slide: Summary and CTA

Each slide should have:
- Title: 3-8 words
- Body: 30-60 words

Also generate a caption or summary (100-200 words).`;
      break;
  }

  const system = `You are an expert social media content creator who specializes in carousel and thread content that goes viral.

## Tone: ${request.tone}

${platformInstructions}

## Content Quality Guidelines:
- Lead with the most surprising or valuable insight
- Use concrete examples and specific numbers when possible
- Create a logical flow from slide to slide
- Each slide should make the reader want to see the next one
- End with a strong, clear call to action
- Avoid generic advice - be specific and actionable
- Write as if you're teaching a friend, not lecturing an audience

## Response format
You MUST respond in valid JSON with this exact structure:
{
  "slides": [
    { "slideNumber": 1, "title": "Slide title", "body": "Slide body text" },
    { "slideNumber": 2, "title": "Slide title", "body": "Slide body text" }
  ],
  "caption": "The accompanying caption/description"
}

Generate exactly ${slideCount} slides. Return ONLY valid JSON.`;

  const user = `Create a ${request.platform} ${request.platform === 'twitter' ? 'thread' : 'carousel'} about: ${request.topic}`;

  const result = await generateText({
    model,
    system,
    messages: [{ role: 'user', content: user }],
    temperature: 0.8,
    maxTokens: 3072,
  });

  const parsed = parseJsonResponse(result.text);
  return {
    slides: Array.isArray(parsed.slides) ? parsed.slides : [],
    caption: parsed.caption ?? '',
  };
}
