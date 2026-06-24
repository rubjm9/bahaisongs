/**
 * Generates PWA icon PNGs from public/icons/favicon-bahaisongs.png.
 * Run with: npm run icons:generate
 *
 * Outputs to public/icons/. Commit the results — they are stable brand art.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const BG = { r: 5, g: 11, b: 26, alpha: 1 };

interface IconSpec {
  file: string;
  size: number;
  maskable: boolean;
}

const ICONS: IconSpec[] = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'maskable-192.png', size: 192, maskable: true },
  { file: 'maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
  { file: 'favicon-32.png', size: 32, maskable: false },
];

async function renderIcon(source: Buffer, size: number, maskable: boolean): Promise<Buffer> {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - padding * 2;

  const icon = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  if (padding === 0) return icon;

  return sharp(icon)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: BG,
    })
    .png()
    .toBuffer();
}

async function main() {
  const sourcePath = join(process.cwd(), 'public', 'icons', 'favicon-bahaisongs.png');
  const outDir = join(process.cwd(), 'public', 'icons');
  const source = await readFile(sourcePath);

  await mkdir(outDir, { recursive: true });

  for (const { file, size, maskable } of ICONS) {
    const buffer = await renderIcon(source, size, maskable);
    await writeFile(join(outDir, file), buffer);
    console.log(`✓ ${file} (${size}×${size})`);
  }

  console.log(`\nWrote ${ICONS.length} icons to public/icons/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
