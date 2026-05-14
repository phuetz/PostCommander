import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import type { ApiResponse } from '@postcommander/shared';
import type { AssistFieldKey } from '@/components/wizard/types';

export interface AssistFieldResponse {
  suggestion: string;
  alternatives?: string[];
}

interface AssistFieldRequest {
  field: AssistFieldKey;
  context?: Record<string, unknown>;
  locale?: string;
}

export async function assistField(req: AssistFieldRequest): Promise<AssistFieldResponse> {
  const { data } = await api.post<ApiResponse<AssistFieldResponse>>('/assist/field', req);
  if (!data.success || !data.data) {
    throw new Error(data.error || 'AI assist failed');
  }
  return data.data;
}

export function useFieldAssist() {
  return useMutation({
    mutationFn: assistField,
  });
}
