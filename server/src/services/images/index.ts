import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import { and, eq, desc } from 'drizzle-orm';
import { getDrizzle } from '../../db/connection.js';
import { generatedImages as imagesTable, settings as settingsTable } from '../../db/schema.js';
import { config } from '../../config/env.js';
import { decryptSecret } from '../../utils/secret-crypto.js';
import { logger } from '../../utils/logger.js';
import { safeFetch } from '../../utils/safe-fetch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const IMAGES_DIR = path.resolve(__dirname, '..', '..', '..', 'data', 'images');

function ensureImagesDir(): void {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

async function downloadImage(url: string, filename: string): Promise<void> {
  ensureImagesDir();
  // safeFetch blocks loopback/RFC1918/link-local/cloud-metadata before issuing
  // the request — SSRF guard for image URLs that originate from third parties
  // (DALL-E response, scraper extraction, future user-supplied URLs).
  const response = await safeFetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status} from ${url})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(path.join(IMAGES_DIR, filename), buffer);
}

/**
 * Convert a PNG file on disk to a sibling JPEG. Returns the JPEG filename on
 * success, or null when sharp isn't available (in which case the caller keeps
 * the PNG as canonical). JPEG is preferred because Instagram Graph API rejects
 * PNG in feed posts and other platforms accept it transparently.
 *
 * `sharp` is required at runtime (not via top-level import) so a server that
 * doesn't have its native bindings still boots; only the conversion path
 * degrades.
 */
async function convertPngToJpeg(pngFilename: string): Promise<string | null> {
  if (!pngFilename.toLowerCase().endsWith('.png')) return null;
  const jpegFilename = pngFilename.replace(/\.png$/i, '.jpg');

  let sharpModule: typeof import('sharp');
  try {
    sharpModule = (await import('sharp')).default as unknown as typeof import('sharp');
  } catch (err) {
    logger.warn({ err }, 'sharp not available — keeping PNG (Instagram publish will fail)');
    return null;
  }

  try {
    const pngPath = path.join(IMAGES_DIR, pngFilename);
    const jpegPath = path.join(IMAGES_DIR, jpegFilename);
    await sharpModule(pngPath)
      // White flatten: JPEG has no alpha channel; transparent regions would
      // otherwise become black.
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(jpegPath);
    return jpegFilename;
  } catch (err) {
    logger.warn({ err, pngFilename }, 'PNG→JPEG conversion failed; keeping PNG');
    return null;
  }
}

const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

export interface ImageBytes {
  bytes: Buffer;
  contentType: string;
}

/**
 * Read image bytes by reading from disk first (imagePath) and falling back to
 * fetching the public/remote imageUrl. Used by platform adapters that need
 * to upload media via multipart (LinkedIn, Twitter), not just by URL reference.
 */
export async function readImageBytes(image: {
  imagePath: string | null;
  imageUrl: string | null;
}): Promise<ImageBytes> {
  if (image.imagePath) {
    const filepath = path.join(IMAGES_DIR, image.imagePath);
    if (fs.existsSync(filepath)) {
      const ext = (path.extname(image.imagePath).slice(1) || 'png').toLowerCase();
      return {
        bytes: fs.readFileSync(filepath),
        contentType: EXT_TO_MIME[ext] ?? 'application/octet-stream',
      };
    }
  }

  if (!image.imageUrl) {
    throw new Error('Image has no path or URL to read from');
  }

  // SSRF guard — imageUrl may point at a third-party CDN (Pinterest, DALL-E, etc).
  const response = await safeFetch(image.imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image bytes (${response.status} from ${image.imageUrl})`);
  }
  const contentType = response.headers.get('content-type') ?? 'image/png';
  const bytes = Buffer.from(await response.arrayBuffer());
  return { bytes, contentType };
}

export interface GeneratedImage {
  id: string;
  postId: string | null;
  prompt: string;
  provider: string;
  imageUrl: string | null;
  imagePath: string | null;
  createdAt: string;
}

interface GeneratedImageRow {
  id: string;
  postId: string | null;
  prompt: string;
  provider: string;
  imageUrl: string | null;
  imagePath: string | null;
  createdAt: string;
}

function rowToImage(row: GeneratedImageRow): GeneratedImage {
  return {
    id: row.id,
    postId: row.postId,
    prompt: row.prompt,
    provider: row.provider,
    imageUrl: row.imageUrl,
    imagePath: row.imagePath,
    createdAt: row.createdAt,
  };
}

async function getOpenAIKey(userId: string): Promise<string | undefined> {
  if (config.OPENAI_API_KEY) return config.OPENAI_API_KEY;

  try {
    const db = getDrizzle();
    const [row] = await db
      .select({ value: settingsTable.value })
      .from(settingsTable)
      .where(and(eq(settingsTable.userId, userId), eq(settingsTable.key, 'openaiApiKey')))
      .limit(1);
    return decryptSecret(row?.value);
  } catch {
    return undefined;
  }
}

/**
 * Generate an image using DALL-E 3 via OpenAI API.
 */
export async function generateImage(
  userId: string,
  prompt: string,
  provider: string = 'openai',
  postId?: string,
): Promise<GeneratedImage> {
  if (provider !== 'openai') {
    throw new Error(
      `Image provider "${provider}" is not supported. Currently only "openai" (DALL-E 3) is available.`,
    );
  }

  const apiKey = await getOpenAIKey(userId);
  if (!apiKey) {
    throw new Error(
      'OpenAI API key not configured. Set OPENAI_API_KEY env var or configure in Settings.',
    );
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `OpenAI API error (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.error?.message ?? errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    data: Array<{ url: string; revised_prompt?: string }>;
  };

  const remoteUrl = data.data?.[0]?.url;
  if (!remoteUrl) {
    throw new Error('No image URL returned from OpenAI');
  }

  // Persist locally — DALL-E URLs expire ~1h, so we download immediately.
  // Filename uses the row id for direct lookup; .png is the format DALL-E returns.
  const id = uuidv4();
  const pngFilename = `${id}.png`;
  try {
    await downloadImage(remoteUrl, pngFilename);
  } catch (err) {
    logger.error({ err, id, remoteUrl }, 'Image download failed; storing remote URL only');
  }

  const pngExists = fs.existsSync(path.join(IMAGES_DIR, pngFilename));

  // Try to derive a JPEG sibling — Instagram Graph API rejects PNG in feed posts.
  // The JPEG, when produced, becomes the canonical URL stored in DB; PNG stays
  // on disk as a backup/source of truth.
  let canonicalFilename: string | null = pngExists ? pngFilename : null;
  if (pngExists) {
    const jpegFilename = await convertPngToJpeg(pngFilename);
    if (jpegFilename) {
      canonicalFilename = jpegFilename;
    }
  }

  const publicUrl = canonicalFilename
    ? `${config.BASE_URL}/api/images/file/${canonicalFilename}`
    : remoteUrl;

  const db = getDrizzle();
  await db.insert(imagesTable).values({
    id,
    userId,
    postId: postId ?? null,
    prompt,
    provider,
    imageUrl: publicUrl,
    imagePath: canonicalFilename,
    createdAt: new Date().toISOString(),
  });

  const [row] = await db.select().from(imagesTable).where(eq(imagesTable.id, id)).limit(1);
  return rowToImage(row);
}

/**
 * Attach (or detach if postId=null) a generated image to a post.
 * Only the image's owner can update it.
 */
export async function updateImagePostLink(
  userId: string,
  imageId: string,
  postId: string | null,
): Promise<GeneratedImage> {
  const db = getDrizzle();
  const [existing] = await db
    .select()
    .from(imagesTable)
    .where(and(eq(imagesTable.userId, userId), eq(imagesTable.id, imageId)))
    .limit(1);

  if (!existing) {
    throw new Error('Image not found');
  }

  await db.update(imagesTable).set({ postId }).where(eq(imagesTable.id, imageId));

  const [row] = await db.select().from(imagesTable).where(eq(imagesTable.id, imageId)).limit(1);
  return rowToImage(row);
}

export async function listImages(userId: string, postId?: string): Promise<GeneratedImage[]> {
  const db = getDrizzle();

  if (postId) {
    const rows = await db
      .select()
      .from(imagesTable)
      .where(and(eq(imagesTable.userId, userId), eq(imagesTable.postId, postId)))
      .orderBy(desc(imagesTable.createdAt));
    return rows.map(rowToImage);
  }

  const rows = await db
    .select()
    .from(imagesTable)
    .where(eq(imagesTable.userId, userId))
    .orderBy(desc(imagesTable.createdAt))
    .limit(100);
  return rows.map(rowToImage);
}
