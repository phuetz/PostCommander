import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { createModel } from './provider-factory.js';
import { LLMProviderId } from '@postcommander/shared';

interface AutoReplyParams {
  providerId: LLMProviderId;
  modelId: string;
  postContent: string;
  commentContent: string;
  authorName: string;
  brandTone?: string;
  userId?: string;
}

export async function scoreLeadInteraction({
  providerId,
  modelId,
  postContent,
  commentContent,
  authorName,
  userId,
}: Omit<AutoReplyParams, 'brandTone'>) {
  const model = createModel(providerId, modelId, userId);

  const systemPrompt = `You are an expert sales development representative (SDR) and community manager.
Your goal is to score a social media comment left by a user on your brand's post.
Analyze the user's intent to determine if they are a potential lead.

Consider:
- Is the user asking for pricing, demo, or more information? (High score)
- Is the user sharing a genuine pain point related to the post? (Medium score)
- Is the user just saying "Great post" or dropping an emoji? (Low score)
- Is the user a competitor or a bot? (Very low score)

Assign a leadScore from 0 to 100.
Assign a leadStatus: 'unscored', 'unqualified' (score < 40), 'potential' (score 40-75), or 'hot' (score > 75).
Provide a brief reason for your score.`;

  const userPrompt = `
Post Content:
"""
${postContent}
"""

Comment by ${authorName}:
"""
${commentContent}
"""
`;

  const { object } = await generateObject({
    model,
    system: systemPrompt,
    prompt: userPrompt,
    schema: z.object({
      leadScore: z.number().min(0).max(100),
      leadStatus: z.enum(['unscored', 'unqualified', 'potential', 'hot']),
      leadReason: z.string(),
    }),
  });

  return object;
}

export async function generateAutoReply({
  providerId,
  modelId,
  postContent,
  commentContent,
  authorName,
  brandTone = 'Professional yet friendly',
  userId,
}: AutoReplyParams): Promise<string> {
  const model = createModel(providerId, modelId, userId);

  const systemPrompt = `You are an expert community manager for a brand.
Your goal is to reply to a social media comment left by a user on your brand's post.

Rules:
1. Be organic, concise, and authentic. Do not sound like a bot.
2. Address the user by their name: ${authorName}.
3. Match the requested tone: ${brandTone}.
4. Do not include hashtags or emojis unless appropriate for the tone.
5. Provide ONLY the raw text of the reply. No conversational filler or explanations.

Context:
- Original Post Content: "${postContent}"
- Comment to reply to: "${commentContent}"
`;

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: `Generate the reply for ${authorName}'s comment.`,
  });

  return text.trim();
}

import { tool, CoreMessage } from 'ai';

interface AgentParams {
  providerId: LLMProviderId;
  modelId: string;
  postContent: string;
  authorName: string;
  history: CoreMessage[];
  userId?: string;
}

export async function runConversationalAgent({
  providerId,
  modelId,
  postContent,
  authorName,
  history,
  userId,
}: AgentParams) {
  const model = createModel(providerId, modelId, userId);

  const systemPrompt = `You are an expert SDR and community manager representing our brand.
You are talking to a user named ${authorName} in the comments of a social media post.
Your goal is to qualify the lead and push them towards the next step, using the provided tools.

Post Context: "${postContent}"

Instructions:
1. Always be professional, concise, and helpful.
2. If the user asks a question, answer it if you can.
3. If the user is showing buying intent, use the bookMeeting tool to send a Calendly link.
4. If the user is a hot lead but needs a custom demo, use escalateToHuman.
5. If the conversation requires you to just reply normally, you can just output text.`;

  const result = await generateText({
    model,
    system: systemPrompt,
    messages: history,
    tools: {
      bookMeeting: tool({
        description: 'Send a meeting booking link to the prospect if they show strong intent.',
        parameters: z.object({
          messageContext: z.string().describe('The message to accompany the booking link.'),
        }),
        execute: async ({ messageContext }) => {
          return `${messageContext}\n\nHere is my calendar link: https://calendly.com/postcommander-demo/30min`;
        },
      }),
      escalateToHuman: tool({
        description: 'Escalate the conversation to a human SDR if the prospect asks complex questions or requests a custom quote.',
        parameters: z.object({
          reason: z.string().describe('The reason for escalation.'),
        }),
        execute: async ({ reason }) => {
          return `[SYSTEM: Conversation escalated to human. Reason: ${reason}]`;
        },
      }),
      askQualifyingQuestion: tool({
        description: 'Ask a specific qualifying question to gauge the prospect\'s budget or timeline.',
        parameters: z.object({
          question: z.string().describe('The question to ask.'),
        }),
        execute: async ({ question }) => {
          return question;
        },
      }),
    },
    maxSteps: 3,
  });

  return result;
}
