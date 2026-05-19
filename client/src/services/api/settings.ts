import type {
  ApiResponse,
  Settings,
  DeletedAccountAudit,
  ExportedAccountData,
} from '@postcommander/shared';
import { api } from './_client.js';

export async function getSettings(): Promise<Settings> {
  const { data } = await api.get<ApiResponse<Settings>>('/settings');
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to load settings');
  return data.data;
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const { data } = await api.put<ApiResponse<Settings>>('/settings', settings);
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to save settings');
  return data.data;
}

export interface AccountExportDownload {
  blob: Blob;
  filename: string;
}

export async function exportAccountData(): Promise<AccountExportDownload> {
  const response = await api.get<Blob>('/auth/export', { responseType: 'blob' });
  const contentDisposition = response.headers['content-disposition'];
  const filenameMatch =
    typeof contentDisposition === 'string'
      ? contentDisposition.match(/filename="(?<filename>[^"]+)"/)
      : null;

  let blob = response.data;
  if (blob.type !== 'application/json') {
    const parsed = JSON.parse(await blob.text()) as ApiResponse<ExportedAccountData>;
    if (!parsed.success) {
      throw new Error(parsed.error || 'Failed to export account data');
    }
    blob = new Blob([JSON.stringify(parsed.data, null, 2)], { type: 'application/json' });
  }

  return {
    blob,
    filename: filenameMatch?.groups?.filename || 'postcommander-export.json',
  };
}

export async function deleteAccount(
  password: string,
  confirmation: 'DELETE',
): Promise<{ message: string }> {
  const { data } = await api.delete<ApiResponse<{ message: string }>>('/auth/account', {
    data: { password, confirmation },
  });
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to delete account');
  }
  return data.data;
}

export interface DeletedAccountsSearchParams {
  email?: string;
  originalUserId?: string;
  stripeCustomerId?: string;
  limit?: number;
}

export async function getDeletedAccounts(
  params: DeletedAccountsSearchParams = {},
): Promise<DeletedAccountAudit[]> {
  const { data } = await api.get<ApiResponse<{ audits: DeletedAccountAudit[] }>>(
    '/admin/deleted-accounts',
    { params },
  );
  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to load deleted account archives');
  }
  return data.data.audits;
}
