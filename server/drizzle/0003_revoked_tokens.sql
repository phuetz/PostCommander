-- A4: JWT revocation table. The middleware checks this on every protected
-- request; the /api/auth/logout endpoint inserts the jti so the token is
-- invalid even before its 7-day expiry. Cleanup of expired rows happens on
-- write (small table, no separate sweeper needed yet).

CREATE TABLE "revoked_tokens" (
  "jti" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "revoked_at" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL
);

CREATE INDEX "idx_revoked_tokens_expires_at" ON "revoked_tokens" USING btree ("expires_at");
CREATE INDEX "idx_revoked_tokens_user" ON "revoked_tokens" USING btree ("user_id");
