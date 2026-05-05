import crypto from 'node:crypto';
import type {
  DeletedAccountAuditSnapshot,
  DeletedBillingRecord,
} from '@postcommander/shared';
import { config } from '../config/env.js';

export function hashDeletedAccountEmail(email: string): string {
  const keyMaterial = config.ENCRYPTION_KEY
    ? Buffer.from(config.ENCRYPTION_KEY, 'hex')
    : config.JWT_SECRET;

  return crypto
    .createHmac('sha256', keyMaterial)
    .update(email.trim().toLowerCase())
    .digest('hex');
}

export function parseDeletedAccountSnapshot(snapshot: string): DeletedAccountAuditSnapshot {
  return JSON.parse(snapshot) as DeletedAccountAuditSnapshot;
}

export function parseDeletedBillingSnapshot(snapshot: string): Record<string, unknown> {
  return JSON.parse(snapshot) as Record<string, unknown>;
}

export function toDeletedBillingRecord(
  row: {
    id: string;
    recordType: string;
    stripeRecordId: string;
    status: string;
    archivedAt: string;
    snapshot: string;
  },
): DeletedBillingRecord {
  return {
    id: row.id,
    recordType: row.recordType as DeletedBillingRecord['recordType'],
    stripeRecordId: row.stripeRecordId,
    status: row.status,
    archivedAt: row.archivedAt,
    snapshot: parseDeletedBillingSnapshot(row.snapshot),
  };
}
