CREATE TABLE IF NOT EXISTS deleted_account_audits (
  id TEXT PRIMARY KEY,
  original_user_id TEXT NOT NULL UNIQUE,
  email_hash TEXT NOT NULL,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL,
  plan_status TEXT NOT NULL,
  user_created_at TEXT,
  deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source TEXT NOT NULL DEFAULT 'self_service',
  snapshot TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deleted_account_audits_deleted_at
  ON deleted_account_audits(deleted_at);

CREATE INDEX IF NOT EXISTS idx_deleted_account_audits_email_hash
  ON deleted_account_audits(email_hash);

CREATE TABLE IF NOT EXISTS deleted_billing_records (
  id TEXT PRIMARY KEY,
  deleted_account_audit_id TEXT NOT NULL REFERENCES deleted_account_audits(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  stripe_record_id TEXT NOT NULL,
  status TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deleted_billing_records_audit
  ON deleted_billing_records(deleted_account_audit_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deleted_billing_records_record
  ON deleted_billing_records(deleted_account_audit_id, record_type, stripe_record_id);
