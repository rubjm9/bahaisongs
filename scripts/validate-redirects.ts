/**
 * Validates that legacy URLs from Google Search Console resolve to known targets.
 *
 * Usage:
 *   npx tsx scripts/validate-redirects.ts
 *   npx tsx scripts/validate-redirects.ts --csv ~/Downloads/.../Páginas.csv
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import catalog from '../src/data/catalog.json';
import { TRACK_SLUGS } from '../src/shared/lib/seo/track-slugs';

const LEGACY_REDIRECTS: Record<string, string> = {
  '/category/canciones': '/category/cancion',
  '/category/oraciones': '/category/oracion',
  '/category/canciones-espanol': '/library?language=es',
  '/category/english': '/library?language=en',
  '/contribuir-con-una-nueva-cancion': '/suggest',
};

function normalizePath(url: string): string {
  try {
    const u = new URL(url);
    let path = u.pathname.replace(/\/$/, '') || '/';
    return path;
  } catch {
    return url.replace(/\/$/, '') || '/';
  }
}

function expectedTarget(path: string): string | 'track' | 'ok' {
  if (path === '/' || path === '') return 'ok';
  if (LEGACY_REDIRECTS[path]) return LEGACY_REDIRECTS[path];
  if (/^\/page\/\d+$/.test(path)) return '/library';
  if (/^\/(es|en)\/song\/[^/]+$/.test(path) || /^\/song\/[^/]+$/.test(path)) {
    const slug = path.split('/').pop()!;
    return `/${slug}`;
  }
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 1 && TRACK_SLUGS.has(segments[0]!)) return 'track';
  if (path.startsWith('/category/')) return 'ok';
  if (
    ['/library', '/search', '/suggest', '/favorites', '/en', '/en/library'].includes(path) ||
    path.startsWith('/en/')
  ) {
    return 'ok';
  }
  return 'unknown';
}

function parseGscCsv(filePath: string): string[] {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).slice(1);
  const urls: string[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const url = line.split(',')[0]?.trim();
    if (url?.startsWith('http')) urls.push(url);
  }
  return urls;
}

function main() {
  const csvArg = process.argv.find((a) => a.endsWith('.csv'));
  const defaultCsv = resolve(
    process.env.HOME ?? '',
    'Downloads/bahaisongs.org-Performance-on-Search-2026-05-27/Páginas.csv',
  );
  const csvPath = csvArg ?? (existsSync(defaultCsv) ? defaultCsv : null);

  const catalogSlugs = new Set((catalog as { slug: string }[]).map((t) => t.slug));
  const missingSlugs: string[] = [];
  for (const slug of TRACK_SLUGS) {
    if (!catalogSlugs.has(slug)) missingSlugs.push(slug);
  }
  if (missingSlugs.length > 0) {
    console.error('Track slugs in middleware set missing from catalog:', missingSlugs);
    process.exit(1);
  }

  const failures: { url: string; path: string; reason: string }[] = [];

  if (csvPath) {
    console.log(`Checking GSC URLs from ${csvPath}`);
    for (const url of parseGscCsv(csvPath)) {
      if (url.includes('dev.bahaisongs.org')) continue;
      const path = normalizePath(url);
      const target = expectedTarget(path);
      if (target === 'unknown') {
        failures.push({ url, path, reason: 'no redirect or track rule' });
      } else if (target !== 'ok' && target !== 'track') {
        const slug = path.match(/^\/(es|en)\/song\/(.+)$/)?.[2];
        if (slug && !TRACK_SLUGS.has(slug)) {
          failures.push({ url, path, reason: `transition redirect slug missing: ${slug}` });
        }
      } else if (target === 'track') {
        const slug = path.slice(1);
        if (!TRACK_SLUGS.has(slug)) {
          failures.push({ url, path, reason: `track slug not in catalog: ${slug}` });
        }
      }
    }
  } else {
    console.warn('No GSC CSV found — validating built-in legacy paths only.');
    for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
      console.log(`  ${from} → ${to}`);
    }
    console.log('  /page/:n → /library');
    console.log('  /{slug} → rewrite (track pages)');
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} URL(s) need attention:\n`);
    for (const f of failures.slice(0, 30)) {
      console.error(`  ${f.url}\n    path=${f.path} — ${f.reason}`);
    }
    process.exit(1);
  }

  console.log('All checked URLs have a known resolution.');
}

main();
