import crypto from 'node:crypto';
import { config } from '../config/env.js';

const SECRET_PREFIX = 'enc:v1';

function getEncryptionKey(): Buffer {
  if (config.ENCRYPTION_KEY) {
    const isHexKey = /^[0-9a-fA-F]{64}$/.test(config.ENCRYPTION_KEY);
    if (!isHexKey) {
      throw new Error('ENCRYPTION_KEY must be a 32-byte hex string.');
    }

    return Buffer.from(config.ENCRYPTION_KEY, 'hex');
  }

  if (config.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be configured in production.');
  }

  // Deterministic non-production fallback to keep local development usable.
  return crypto.createHash('sha256').update(config.JWT_SECRET).digest();
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(`${SECRET_PREFIX}:`);
}

export function encryptSecret(value: string): string {
  if (!value) {
    return value;
  }

  if (isEncryptedSecret(value)) {
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv, {
    authTagLength: 16,
  });
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    SECRET_PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

export function decryptSecret(value: string | null | undefined): string | undefined {
  if (!value) {
    return value ?? undefined;
  }

  if (!isEncryptedSecret(value)) {
    return value;
  }

  const [prefix, version, ivPart, tagPart, ciphertextPart] = value.split(':');

  if (`${prefix}:${version}` !== SECRET_PREFIX || !ivPart || !tagPart || !ciphertextPart) {
    throw new Error('Invalid encrypted secret format.');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivPart, 'base64url'),
    {
      authTagLength: 16,
    },
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}
