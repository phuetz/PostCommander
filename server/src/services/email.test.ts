import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../config/env.js';
import { sendPasswordResetEmail } from './email/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTBOX_DIR = path.join(__dirname, '..', '..', 'data', 'outbox');

describe('sendPasswordResetEmail', () => {
  const originalWebhookUrl = config.PASSWORD_RESET_WEBHOOK_URL;
  const originalResendKey = config.RESEND_API_KEY;

  beforeEach(() => {
    config.PASSWORD_RESET_WEBHOOK_URL = undefined;
    config.RESEND_API_KEY = undefined;
    fs.rmSync(OUTBOX_DIR, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    config.PASSWORD_RESET_WEBHOOK_URL = originalWebhookUrl;
    config.RESEND_API_KEY = originalResendKey;
    fs.rmSync(OUTBOX_DIR, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('writes a password reset payload to the local outbox when no webhook is configured', async () => {
    await sendPasswordResetEmail({
      email: 'user+test@example.com',
      resetUrl: 'https://app.example.com/reset-password?token=abc123',
    });

    const files = fs.readdirSync(OUTBOX_DIR);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('password-reset-user_test_example.com');

    const payload = JSON.parse(fs.readFileSync(path.join(OUTBOX_DIR, files[0]), 'utf8')) as {
      type: string;
      email: string;
      resetUrl: string;
      createdAt: string;
    };

    expect(payload.type).toBe('password_reset');
    expect(payload.email).toBe('user+test@example.com');
    expect(payload.resetUrl).toContain('token=abc123');
    expect(payload.createdAt).toBeTruthy();
  });

  it('dispatches through the configured webhook instead of writing to disk', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn(),
    });
    vi.stubGlobal('fetch', fetchMock);
    config.PASSWORD_RESET_WEBHOOK_URL = 'https://hooks.example.com/password-reset';

    await sendPasswordResetEmail({
      email: 'user@example.com',
      resetUrl: 'https://app.example.com/reset-password?token=xyz789',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.example.com/password-reset',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as { body: string }).body) as {
      type: string;
      email: string;
      resetUrl: string;
    };

    expect(body).toEqual({
      type: 'password_reset',
      email: 'user@example.com',
      resetUrl: 'https://app.example.com/reset-password?token=xyz789',
    });
    expect(fs.existsSync(OUTBOX_DIR)).toBe(false);
  });

  it('sends through Resend when RESEND_API_KEY is set, taking precedence over webhook and outbox', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: vi.fn() });
    vi.stubGlobal('fetch', fetchMock);
    config.RESEND_API_KEY = 'test_resend_key';
    config.PASSWORD_RESET_WEBHOOK_URL = 'https://hooks.example.com/password-reset';

    await sendPasswordResetEmail({
      email: 'user@example.com',
      resetUrl: 'https://app.example.com/reset-password?token=xyz789',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer test_resend_key');
    const body = JSON.parse(init.body) as { to: string; subject: string; html: string };
    expect(body.to).toBe('user@example.com');
    expect(body.subject).toContain('password');
    expect(body.html).toContain('token=xyz789');
    expect(fs.existsSync(OUTBOX_DIR)).toBe(false);
  });
});
