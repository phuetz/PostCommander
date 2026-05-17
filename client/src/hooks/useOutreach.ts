import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OutreachCampaign, OutreachProspect } from '@postcommander/shared';
import { api } from '@/services/api';

const API_BASE = '/api/outreach';

export function useOutreachCampaigns() {
  return useQuery({
    queryKey: ['outreach-campaigns'],
    queryFn: async () => {
      const res = await api.get(`${API_BASE}/campaigns`);
      return res.data.data as (OutreachCampaign & { stats: any })[];
    },
  });
}

export function useOutreachProspects(campaignId: string) {
  return useQuery({
    queryKey: ['outreach-prospects', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const res = await api.get(`${API_BASE}/campaigns/${campaignId}/prospects`);
      return res.data.data as OutreachProspect[];
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`${API_BASE}/campaigns`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await api.put(`${API_BASE}/campaigns/${id}`, updates);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`${API_BASE}/campaigns/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-campaigns'] });
    },
  });
}
