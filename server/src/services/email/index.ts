import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTBOX_DIR = path.join(__dirname, '..', '..', '..', 'data', 'outbox');

function ensureOutboxDir(): void {
  if (!fs.existsSync(OUTBOX_DIR)) {
    fs.mkdirSync(OUTBOX_DIR, { recursive: true });
  }
}

function sanitizeEmailForFile(email: string): string {
  return email.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export interface PasswordResetEmailPayload {
  email: string;
  resetUrl: string;
}

function renderResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  const subject = 'Reset your PostCommander password';
  const text = `You requested a password reset. Open this link to choose a new password:\n\n${resetUrl}\n\nThe link expires in 1 hour. If you didn't request this, ignore this email.`;
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
<h2 style="margin:0 0 16px">Reset your password</h2>
<p>You requested a password reset for your PostCommander account.</p>
<p style="margin:24px 0"><a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Choose a new password</a></p>
<p style="color:#6b7280;font-size:14px">Or copy this link: <br><span style="word-break:break-all">${resetUrl}</span></p>
<p style="color:#6b7280;font-size:14px">The link expires in 1 hour. If you didn't request this, ignore this email.</p>
</body></html>`;
  return { subject, html, text };
}

async function sendViaResend(payload: PasswordResetEmailPayload): Promise<void> {
  const { subject, html, text } = renderResetEmail(payload.resetUrl);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.RESEND_FROM,
      to: payload.email,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend send failed (${response.status})${body ? `: ${body}` : ''}`);
  }
}

async function sendViaWebhook(payload: PasswordResetEmailPayload): Promise<void> {
  const response = await fetch(config.PASSWORD_RESET_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'password_reset',
      email: payload.email,
      resetUrl: payload.resetUrl,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Password reset webhook failed with ${response.status}${body ? `: ${body}` : ''}`,
    );
  }
}

function writeToOutbox(payload: PasswordResetEmailPayload): void {
  ensureOutboxDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-password-reset-${sanitizeEmailForFile(payload.email)}.json`;
  const filepath = path.join(OUTBOX_DIR, filename);
  fs.writeFileSync(
    filepath,
    JSON.stringify(
      { type: 'password_reset', createdAt: new Date().toISOString(), ...payload },
      null,
      2,
    ),
  );
  logger.warn(
    { email: payload.email, filepath },
    'Password reset email written to outbox (no real delivery — set RESEND_API_KEY or PASSWORD_RESET_WEBHOOK_URL)',
  );
}

export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
  if (config.RESEND_API_KEY) {
    await sendViaResend(payload);
    logger.info({ email: payload.email }, 'Password reset email dispatched via Resend');
    return;
  }

  if (config.PASSWORD_RESET_WEBHOOK_URL) {
    await sendViaWebhook(payload);
    logger.info({ email: payload.email }, 'Password reset email dispatched via webhook');
    return;
  }

  if (config.NODE_ENV === 'production') {
    throw new Error(
      'No password reset transport configured. Set RESEND_API_KEY or PASSWORD_RESET_WEBHOOK_URL.',
    );
  }

  writeToOutbox(payload);
}
