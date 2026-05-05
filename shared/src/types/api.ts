export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface PlatformConnection {
  id: string;
  platform: string;
  accountName: string | null;
  connected: boolean;
  connectedAt: string;
}

export interface Settings {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  mistralApiKey?: string;
  ollamaBaseUrl?: string;
  defaultProvider?: string;
  defaultModel?: string;
  defaultTone?: string;
  defaultLanguage?: string;
}

export interface ExportedPlatformConnection {
  id: string;
  platform: string;
  accountName: string | null;
  tokenExpires: string | null;
  scopes: string | null;
  metadata: string | null;
  connectedAt: string;
  updatedAt: string;
}

export interface ExportedAccountData {
  exportedAt: string;
  user: Record<string, unknown>;
  settings: Record<string, string>;
  platformConnections: ExportedPlatformConnection[];
  posts: Record<string, unknown>[];
  writingStyles: Record<string, unknown>[];
  generatedImages: Record<string, unknown>[];
  contentPillars: Record<string, unknown>[];
  contentIdeas: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  notes: string[];
}

export interface DeletedAccountContentCounts {
  settings: number;
  platformConnections: number;
  posts: number;
  writingStyles: number;
  generatedImages: number;
  contentPillars: number;
  contentIdeas: number;
}

export interface DeletedAccountBillingCounts {
  subscriptions: number;
  invoices: number;
}

export interface DeletedAccountAuditSnapshot {
  user: Record<string, unknown>;
  contentCounts: DeletedAccountContentCounts;
  billingCounts: DeletedAccountBillingCounts;
}

export interface DeletedBillingRecord {
  id: string;
  recordType: 'subscription' | 'invoice';
  stripeRecordId: string;
  status: string;
  archivedAt: string;
  snapshot: Record<string, unknown>;
}

export interface DeletedAccountAudit {
  id: string;
  originalUserId: string;
  emailHash: string;
  stripeCustomerId: string | null;
  plan: string;
  planStatus: string;
  userCreatedAt: string | null;
  deletedAt: string;
  source: string;
  snapshot: DeletedAccountAuditSnapshot;
  billingRecords: DeletedBillingRecord[];
}
