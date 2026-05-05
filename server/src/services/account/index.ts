import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb, getDrizzle } from '../../db/connection.js';
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

  const [settings, platformConnections, posts, writingStyles, generatedImages, contentPillars, contentIdeas, subscriptions, invoices] =
    await Promise.all([
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
      ? decryptSecret(setting.value) ?? ''
      : setting.value;
  }

  const platformConnectionsExport: ExportedPlatformConnection[] = platformConnections.map((connection) => ({
    id: connection.id,
    platform: connection.platform,
    accountName: connection.accountName,
    tokenExpires: connection.tokenExpires,
    scopes: connection.scopes,
    metadata: connection.metadata,
    connectedAt: connection.connectedAt,
    updatedAt: connection.updatedAt,
  }));

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
    notes: [
      'Sensitive platform access tokens are excluded from exports for security reasons.',
    ],
  };
}

export async function deleteAccountData(userId: string): Promise<void> {
  const db = getDrizzle();
  const sqlite = getDb();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    return;
  }

  const [settings, platformConnections, posts, writingStyles, generatedImages, contentPillars, contentIdeas, subscriptions, invoices] =
    await Promise.all([
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
        deleted_account_audit_id: auditId,
        record_type: 'subscription',
        stripe_record_id: subscription.stripeSubscriptionId,
        status: subscription.status,
        snapshot: JSON.stringify(snapshot),
        archived_at: deletedAt,
      };
    }),
    ...invoices.map((invoice) => {
      const { userId: _userId, ...snapshot } = invoice;
      void _userId;
      return {
        id: randomUUID(),
        deleted_account_audit_id: auditId,
        record_type: 'invoice',
        stripe_record_id: invoice.stripeInvoiceId,
        status: invoice.status,
        snapshot: JSON.stringify(snapshot),
        archived_at: deletedAt,
      };
    }),
  ];

  const runDeletion = sqlite.transaction(() => {
    sqlite
      .prepare(
        `
          INSERT INTO deleted_account_audits (
            id,
            original_user_id,
            email_hash,
            stripe_customer_id,
            plan,
            plan_status,
            user_created_at,
            deleted_at,
            source,
            snapshot
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        auditId,
        user.id,
        emailHash,
        user.stripeCustomerId,
        user.plan,
        user.planStatus,
        user.createdAt,
        deletedAt,
        'self_service',
        accountSnapshot,
      );

    const insertBillingRecord = sqlite.prepare(
      `
        INSERT INTO deleted_billing_records (
          id,
          deleted_account_audit_id,
          record_type,
          stripe_record_id,
          status,
          snapshot,
          archived_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    );

    for (const row of billingArchiveRows) {
      insertBillingRecord.run(
        row.id,
        row.deleted_account_audit_id,
        row.record_type,
        row.stripe_record_id,
        row.status,
        row.snapshot,
        row.archived_at,
      );
    }

    sqlite.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });

  runDeletion();
}
