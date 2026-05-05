import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { IMAGES_DIR } from './index.js';

/**
 * The conversion helper in services/images/index.ts is internal. Rather than
 * exporting it just for tests, we exercise it indirectly: drop a PNG in the
 * IMAGES_DIR and assert that calling sharp the same way the helper does
 * produces a JPEG that the file route can serve.
 *
 * This catches install-time issues with sharp (missing native bindings)
 * without requiring an OpenAI key or DALL-E call.
 */
describe('PNG → JPEG conversion (sharp smoke test)', () => {
  const testPng = path.join(IMAGES_DIR, 'jpeg-test.png');
  const testJpeg = path.join(IMAGES_DIR, 'jpeg-test.jpg');

  beforeAll(async () => {
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toFile(testPng);
  });

  afterAll(() => {
    fs.rmSync(testPng, { force: true });
    fs.rmSync(testJpeg, { force: true });
  });

  it('produces a non-empty JPEG with the expected magic bytes', async () => {
    await sharp(testPng)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(testJpeg);

    expect(fs.existsSync(testJpeg)).toBe(true);
    const buf = fs.readFileSync(testJpeg);
    expect(buf.byteLength).toBeGreaterThan(0);
    // JPEG SOI marker = FF D8 FF
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8);
    expect(buf[2]).toBe(0xff);
  });
});
