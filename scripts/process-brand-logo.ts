/**
 * Prepares UI-ready lockups from the brand PNGs in public/icons/.
 * Run with: npm run brand:logo
 *
 * Sources (do not overwrite):
 *   - public/icons/logo-bahaisongs.png
 *   - public/icons/favicon-bahaisongs.png
 *
 * Outputs:
 *   - public/icons/logo-lockup.png  (trimmed, no tagline, transparent)
 *   - public/icons/icon-lockup.png  (transparent background)
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const ICONS_DIR = join(process.cwd(), 'public', 'icons');
const LOGO_SOURCE = join(ICONS_DIR, 'logo-bahaisongs.png');
const ICON_SOURCE = join(ICONS_DIR, 'favicon-bahaisongs.png');
const LOGO_OUTPUT = join(ICONS_DIR, 'logo-lockup.png');
const ICON_OUTPUT = join(ICONS_DIR, 'icon-lockup.png');
const TAGLINE_CROP_RATIO = 0.82;

function makeBlackTransparent(data: Buffer, width: number, height: number): Buffer {
  const pixels = new Uint8Array(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    if (r < 45 && g < 45 && b < 45) pixels[i + 3] = 0;
  }
  return Buffer.from(pixels);
}

async function processLogo(): Promise<void> {
  const trimmed = await sharp(LOGO_SOURCE).trim({ threshold: 20 }).png().toBuffer();
  const { width = 0, height = 0 } = await sharp(trimmed).metadata();
  const cropHeight = Math.round(height * TAGLINE_CROP_RATIO);

  const { data, info } = await sharp(trimmed)
    .extract({ left: 0, top: 0, width, height: cropHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const transparent = makeBlackTransparent(data, info.width, info.height);
  const png = await sharp(transparent, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  await writeFile(LOGO_OUTPUT, png);
  console.log(`✓ ${LOGO_OUTPUT} (${info.width}×${info.height})`);
}

async function processIcon(): Promise<void> {
  const { data, info } = await sharp(ICON_SOURCE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const transparent = makeBlackTransparent(data, info.width, info.height);
  const png = await sharp(transparent, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  await writeFile(ICON_OUTPUT, png);
  console.log(`✓ ${ICON_OUTPUT} (${info.width}×${info.height})`);
}

async function main() {
  await processLogo();
  await processIcon();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
