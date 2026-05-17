import { z } from 'zod';

export const OutreachPlatformSchema = z.enum(['linkedin', 'twitter', 'email']);
export type OutreachPlatform = z.infer<typeof OutreachPlatformSchema>;

export const OutreachCampaignStatusSchema = z.enum(['active', 'paused', 'completed']);
export type OutreachCampaignStatus = z.infer<typeof OutreachCampaignStatusSchema>;

export const OutreachProspectStatusSchema = z.enum(['discovered', 'contacted']);
export type OutreachProspectStatus = z.infer<typeof OutreachProspectStatusSchema>;

export const CreateOutreachSequenceStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  delayDays: z.number().int().min(0),
  promptTemplate: z.string().min(1, 'Prompt template is required'),
});

export const CreateOutreachCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  targetKeywords: z.string().min(1, 'Target keywords are required'),
  targetActivity: z.string().optional(),
  campaignGoal: z.string().min(1, 'Campaign goal is required'),
  platform: OutreachPlatformSchema,
  dailyLimit: z.number().int().min(1).max(100),
  steps: z.array(CreateOutreachSequenceStepSchema).optional(),
});

export type CreateOutreachCampaignInput = z.infer<typeof CreateOutreachCampaignSchema>;

export const UpdateOutreachCampaignSchema = CreateOutreachCampaignSchema.partial().extend({
  status: OutreachCampaignStatusSchema.optional(),
});

export type CreateOutreachSequenceStepInput = z.infer<typeof CreateOutreachSequenceStepSchema>;

export type UpdateOutreachCampaignInput = z.infer<typeof UpdateOutreachCampaignSchema>;

export interface OutreachCampaign {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  targetKeywords: string;
  targetActivity: string | null;
  campaignGoal: string;
  platform: OutreachPlatform;
  dailyLimit: number;
  status: OutreachCampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachProspect {
  id: string;
  campaignId: string;
  profileName: string;
  profileBio: string;
  profileUrl: string | null;
  status: OutreachProspectStatus;
  replyStatus: string;
  currentStepNumber: number;
  threadContext: string | null;
  generatedMessage: string | null;
  lastContactedAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface OutreachSequenceStep {
  id: string;
  campaignId: string;
  stepNumber: number;
  delayDays: number;
  promptTemplate: string;
  createdAt: string;
}

export interface OutreachReply {
  id: string;
  prospectId: string;
  content: string;
  receivedAt: string;
}
