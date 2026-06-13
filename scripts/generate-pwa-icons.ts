/**
 * Generates PWA icon PNGs from the brand nine-pointed star (see BrandMark.tsx).
 * Run with: npm run icons:generate
 *
 * Outputs to public/icons/. Commit the results — they are stable brand art.
 * Replace with final artwork by re-running or swapping the files.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const BG = '#050B1A';
const GRAD_FROM = '#6EA8FE'; // accent.glow
const GRAD_TO = '#4FD1FF'; // accent.cyan

/** Nine-pointed star path, centred in a `size`×`size` box at scale `fill` (0–1). */
function starPolygon(size: number, fill: number): string {
  const points = 9;
  const cx = size / 2;
  const cy = size / 2;
  const r1 = (size / 2) * fill;
  const r2 = r1 * (5.6 / 14); // inner/outer ratio from BrandMark
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    coords.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return coords.join(' ');
}

function svg(size: number, { maskable }: { maskable: boolean }): string {
  // Maskable icons keep the star inside the ~80% safe zone.
  const fill = maskable ? 0.56 : 0.74;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GRAD_FROM}"/>
      <stop offset="100%" stop-color="${GRAD_TO}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <polygon points="${starPolygon(size, fill)}" fill="url(#g)"/>
</svg>`;
}

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

async function main() {
  const outDir = join(process.cwd(), 'public', 'icons');
  await mkdir(outDir, { recursive: true });

  for (const { file, size, maskable } of ICONS) {
    const buffer = await sharp(Buffer.from(svg(size, { maskable }))).png().toBuffer();
    await writeFile(join(outDir, file), buffer);
    console.log(`✓ ${file} (${size}×${size})`);
  }
  console.log(`\nWrote ${ICONS.length} icons to public/icons/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
