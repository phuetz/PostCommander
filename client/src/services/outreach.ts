import api from './api';
import type { 
  OutreachCampaign, 
  CreateOutreachCampaignInput, 
  UpdateOutreachCampaignInput, 
  OutreachProspect,
  ApiResponse
} from '@postcommander/shared';

// We override OutreachCampaign here slightly to include stats returned by the backend
export interface OutreachCampaignWithStats extends OutreachCampaign {
  stats?: {
    totalProspects: number;
    discovered: number;
    contacted: number;
  };
}

export const getCampaigns = async (): Promise<OutreachCampaignWithStats[]> => {
  const { data } = await api.get<ApiResponse<OutreachCampaignWithStats[]>>('/outreach/campaigns');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch campaigns');
  return data.data;
};

export const createCampaign = async (input: CreateOutreachCampaignInput): Promise<OutreachCampaign> => {
  const { data } = await api.post<ApiResponse<OutreachCampaign>>('/outreach/campaigns', input);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to create campaign');
  return data.data;
};

export const updateCampaign = async (id: string, input: UpdateOutreachCampaignInput): Promise<OutreachCampaign> => {
  const { data } = await api.put<ApiResponse<OutreachCampaign>>(`/outreach/campaigns/${id}`, input);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to update campaign');
  return data.data;
};

export const deleteCampaign = async (id: string): Promise<void> => {
  const { data } = await api.delete<ApiResponse<void>>(`/outreach/campaigns/${id}`);
  if (!data.success) throw new Error(data.error || 'Failed to delete campaign');
};

export const getCampaignProspects = async (id: string): Promise<OutreachProspect[]> => {
  const { data } = await api.get<ApiResponse<OutreachProspect[]>>(`/outreach/campaigns/${id}/prospects`);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch prospects');
  return data.data;
};
