import type { Request, Response } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type {
  ApiResponse,
  DeletedAccountAudit,
  DeletedAccountsQuery,
} from '@postcommander/shared';
import { getDrizzle } from '../db/connection.js';
import {
  deletedAccountAudits as deletedAccountAuditsTable,
  deletedBillingRecords as deletedBillingRecordsTable,
} from '../db/schema.js';
import { catchAsync } from '../utils/catch-async.js';
import {
  hashDeletedAccountEmail,
  parseDeletedAccountSnapshot,
  toDeletedBillingRecord,
} from '../utils/deleted-account-audit.js';

export const listDeletedAccounts = catchAsync(async (req: Request, res: Response) => {
  const query = (req.validatedQuery ?? req.query) as DeletedAccountsQuery;
  const db = getDrizzle();

  const filters = [];
  if (query.email) {
    filters.push(eq(deletedAccountAuditsTable.emailHash, hashDeletedAccountEmail(query.email)));
  }
  if (query.originalUserId) {
    filters.push(eq(deletedAccountAuditsTable.originalUserId, query.originalUserId));
  }
  if (query.stripeCustomerId) {
    filters.push(eq(deletedAccountAuditsTable.stripeCustomerId, query.stripeCustomerId));
  }

  const audits =
    filters.length > 0
      ? await db
          .select()
          .from(deletedAccountAuditsTable)
          .where(and(...filters))
          .orderBy(desc(deletedAccountAuditsTable.deletedAt))
          .limit(query.limit)
      : await db
          .select()
          .from(deletedAccountAuditsTable)
          .orderBy(desc(deletedAccountAuditsTable.deletedAt))
          .limit(query.limit);

  const billingRows =
    audits.length > 0
      ? await db
          .select()
          .from(deletedBillingRecordsTable)
          .where(
            inArray(
              deletedBillingRecordsTable.deletedAccountAuditId,
              audits.map((audit) => audit.id),
            ),
          )
          .orderBy(desc(deletedBillingRecordsTable.archivedAt))
      : [];

  const billingByAuditId = new Map<string, ReturnType<typeof toDeletedBillingRecord>[]>();
  for (const row of billingRows) {
    const records = billingByAuditId.get(row.deletedAccountAuditId) ?? [];
    records.push(
      toDeletedBillingRecord({
        id: row.id,
        recordType: row.recordType,
        stripeRecordId: row.stripeRecordId,
        status: row.status,
        archivedAt: row.archivedAt,
        snapshot: row.snapshot,
      }),
    );
    billingByAuditId.set(row.deletedAccountAuditId, records);
  }

  const deletedAccounts: DeletedAccountAudit[] = audits.map((audit) => ({
    id: audit.id,
    originalUserId: audit.originalUserId,
    emailHash: audit.emailHash,
    stripeCustomerId: audit.stripeCustomerId,
    plan: audit.plan,
    planStatus: audit.planStatus,
    userCreatedAt: audit.userCreatedAt,
    deletedAt: audit.deletedAt,
    source: audit.source,
    snapshot: parseDeletedAccountSnapshot(audit.snapshot),
    billingRecords: billingByAuditId.get(audit.id) ?? [],
  }));

  const response: ApiResponse<{ audits: DeletedAccountAudit[] }> = {
    success: true,
    data: {
      audits: deletedAccounts,
    },
  };

  res.json(response);
});
