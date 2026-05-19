import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDrizzle } from '../../db/connection.js';
import {
  users as usersTable,
  settings as settingsTable,
  platformConnections as platformConnectionsTable,
  posts as postsTable,
  writingStyles as writingStylesTable,
  generatedImages as generatedImagesTable,
  contentPillars as contentPillarsTable,
  contentIdeas as contentIdeasTable,
  subscriptions as subscriptionsTable,
  invoices as invoicesTable,
  deletedAccountAudits as deletedAccountAuditsTable,
  deletedBillingRecords as deletedBillingRecordsTable,
} from '../../db/schema.js';
import { decryptSecret } from '../../utils/secret-crypto.js';
import { hashDeletedAccountEmail } from '../../utils/deleted-account-audit.js';
import type { ExportedAccountData, ExportedPlatformConnection } from '@postcommander/shared';

const SENSITIVE_SETTINGS = new Set([
  'openaiApiKey',
  'anthropicApiKey',
  'googleApiKey',
  'mistralApiKey',
]);

export async function exportAccountData(userId: string): Promise<ExportedAccountData> {
  const db = getDrizzle();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    throw new Error('User not found');
  }

  const [
    settings,
    platformConnections,
    posts,
    writingStyles,
    generatedImages,
    contentPillars,
    contentIdeas,
    subscriptions,
    invoices,
  ] = await Promise.all([
    db.select().from(settingsTable).where(eq(settingsTable.userId, userId)),
    db.select().from(platformConnectionsTable).where(eq(platformConnectionsTable.userId, userId)),
    db.select().from(postsTable).where(eq(postsTable.userId, userId)),
    db.select().from(writingStylesTable).where(eq(writingStylesTable.userId, userId)),
    db.select().from(generatedImagesTable).where(eq(generatedImagesTable.userId, userId)),
    db.select().from(contentPillarsTable).where(eq(contentPillarsTable.userId, userId)),
    db.select().from(contentIdeasTable).where(eq(contentIdeasTable.userId, userId)),
    db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)),
    db.select().from(invoicesTable).where(eq(invoicesTable.userId, userId)),
  ]);

  const settingsExport: Record<string, string> = {};
  for (const setting of settings) {
    settingsExport[setting.key] = SENSITIVE_SETTINGS.has(setting.key)
      ? (decryptSecret(setting.value) ?? '')
      : setting.value;
  }

  const platformConnectionsExport: ExportedPlatformConnection[] = platformConnections.map(
    (connection) => ({
      id: connection.id,
      platform: connection.platform,
      accountName: connection.accountName,
      tokenExpires: connection.tokenExpires,
      scopes: connection.scopes,
      metadata: connection.metadata,
      connectedAt: connection.connectedAt,
      updatedAt: connection.updatedAt,
    }),
  );

  const { passwordHash, ...safeUser } = user;
  void passwordHash;

  return {
    exportedAt: new Date().toISOString(),
    user: safeUser,
    settings: settingsExport,
    platformConnections: platformConnectionsExport,
    posts,
    writingStyles,
    generatedImages,
    contentPillars,
    contentIdeas,
    subscriptions,
    invoices,
    notes: ['Sensitive platform access tokens are excluded from exports for security reasons.'],
  };
}

export async function deleteAccountData(userId: string): Promise<void> {
  const db = getDrizzle();

  // Everything inside the transaction so the snapshot stays consistent with
  // what actually gets deleted — a concurrent INSERT by the same user (race
  // with another tab / outstanding API request) would otherwise:
  //   1. miss the snapshot counts (read-outside-tx), and
  //   2. get silently cascade-deleted (delete-inside-tx).
  // Reads inside the tx give us repeatable-read consistency for free.
  await db.transaction(async (tx) => {
    const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      return;
    }

    const [
      settings,
      platformConnections,
      posts,
      writingStyles,
      generatedImages,
      contentPillars,
      contentIdeas,
      subscriptions,
      invoices,
    ] = await Promise.all([
      tx.select().from(settingsTable).where(eq(settingsTable.userId, userId)),
      tx
        .select()
        .from(platformConnectionsTable)
        .where(eq(platformConnectionsTable.userId, userId)),
      tx.select().from(postsTable).where(eq(postsTable.userId, userId)),
      tx.select().from(writingStylesTable).where(eq(writingStylesTable.userId, userId)),
      tx.select().from(generatedImagesTable).where(eq(generatedImagesTable.userId, userId)),
      tx.select().from(contentPillarsTable).where(eq(contentPillarsTable.userId, userId)),
      tx.select().from(contentIdeasTable).where(eq(contentIdeasTable.userId, userId)),
      tx.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId)),
      tx.select().from(invoicesTable).where(eq(invoicesTable.userId, userId)),
    ]);

    const deletedAt = new Date().toISOString();
    const auditId = randomUUID();
    const emailHash = hashDeletedAccountEmail(user.email);
    const { passwordHash, email, ...safeUser } = user;
    void passwordHash;
    void email;

    const accountSnapshot = JSON.stringify({
      user: safeUser,
      contentCounts: {
        settings: settings.length,
        platformConnections: platformConnections.length,
        posts: posts.length,
        writingStyles: writingStyles.length,
        generatedImages: generatedImages.length,
        contentPillars: contentPillars.length,
        contentIdeas: contentIdeas.length,
      },
      billingCounts: {
        subscriptions: subscriptions.length,
        invoices: invoices.length,
      },
    });

    const billingArchiveRows = [
      ...subscriptions.map((subscription) => {
        const { userId: _userId, ...snapshot } = subscription;
        void _userId;
        return {
          id: randomUUID(),
          deletedAccountAuditId: auditId,
          recordType: 'subscription',
          stripeRecordId: subscription.stripeSubscriptionId,
          status: subscription.status,
          snapshot: JSON.stringify(snapshot),
          archivedAt: deletedAt,
        };
      }),
      ...invoices.map((invoice) => {
        const { userId: _userId, ...snapshot } = invoice;
        void _userId;
        return {
          id: randomUUID(),
          deletedAccountAuditId: auditId,
          recordType: 'invoice',
          stripeRecordId: invoice.stripeInvoiceId,
          status: invoice.status,
          snapshot: JSON.stringify(snapshot),
          archivedAt: deletedAt,
        };
      }),
    ];

    await tx.insert(deletedAccountAuditsTable).values({
      id: auditId,
      originalUserId: user.id,
      emailHash,
      stripeCustomerId: user.stripeCustomerId,
      plan: user.plan,
      planStatus: user.planStatus,
      userCreatedAt: user.createdAt,
      deletedAt,
      source: 'self_service',
      snapshot: accountSnapshot,
    });

    if (billingArchiveRows.length > 0) {
      await tx.insert(deletedBillingRecordsTable).values(billingArchiveRows);
    }

    // Cascade-deletes all child tables via the FK ON DELETE CASCADE constraints.
    await tx.delete(usersTable).where(eq(usersTable.id, userId));
  });
}
