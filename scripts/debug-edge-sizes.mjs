/**
 * Debug probe: measure Edge Function sizes under .vercel/output/functions.
 * Writes NDJSON to the ingest endpoint (and stdout).
 *
 * Usage: node scripts/debug-edge-sizes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SESSION = 'e33944';
const ENDPOINT = 'http://127.0.0.1:7381/ingest/ab6e65c4-05ba-489d-bedd-4a80e494ddaa';
const ROOT = path.join(process.cwd(), '.vercel/output/functions');
const LIMIT = 1024 * 1024;
const RUN_ID = process.env.DEBUG_RUN_ID ?? 'post-fix';

async function emit(payload) {
  const body = JSON.stringify({ sessionId: SESSION, timestamp: Date.now(), ...payload });
  console.log(body);
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION },
      body,
    });
  } catch {
    // ingest optional
  }
}

function walkIndexJs(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkIndexJs(p, acc);
    else if (ent.name === 'index.js' && p.includes('.func/')) acc.push(p);
  }
  return acc;
}

function readRuntime(funcDir) {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(funcDir, '.vc-config.json'), 'utf8'));
    return { runtime: cfg.runtime ?? null, name: cfg.name ?? null, assets: cfg.assets?.length ?? 0 };
  } catch {
    return { runtime: null, name: null, assets: 0 };
  }
}

const files = walkIndexJs(ROOT);
await emit({
  hypothesisId: 'A',
  location: 'scripts/debug-edge-sizes.mjs:start',
  message: 'scan-start',
  data: { rootExists: fs.existsSync(ROOT), functionCount: files.length },
  runId: RUN_ID,
});

if (!fs.existsSync(ROOT) || files.length === 0) {
  await emit({
    hypothesisId: 'A',
    location: 'scripts/debug-edge-sizes.mjs:missing',
    message: 'no-vercel-output',
    data: { hint: 'Run npx vercel build first (or deploy once) so .vercel/output exists' },
    runId: RUN_ID,
  });
  process.exit(1);
}

const rows = files
  .map((f) => {
    const buf = fs.readFileSync(f);
    const gz = zlib.gzipSync(buf);
    const funcDir = path.dirname(f);
    const meta = readRuntime(funcDir);
    const rel = path.relative(ROOT, funcDir);
    return {
      rel,
      name: meta.name,
      runtime: meta.runtime,
      assets: meta.assets,
      bytes: buf.length,
      mb: +(buf.length / LIMIT).toFixed(3),
      gzBytes: gz.length,
      gzMb: +(gz.length / LIMIT).toFixed(3),
      over1MbUncompressed: buf.length > LIMIT,
      over1MbGzip: gz.length > LIMIT,
    };
  })
  .sort((a, b) => b.bytes - a.bytes);

const playlist = rows.find((r) => r.rel === 'admin/playlists/[id].func' || r.name === 'admin/playlists/[id]');
const edgeCount = rows.filter((r) => r.runtime === 'edge').length;
const over = rows.filter((r) => r.bytes > LIMIT || r.gzBytes > LIMIT);

await emit({
  hypothesisId: 'A',
  location: 'scripts/debug-edge-sizes.mjs:summary',
  message: 'edge-runtime-summary',
  data: {
    edgeCount,
    totalFuncs: rows.length,
    overLimitCount: over.length,
    playlistId: playlist ?? null,
    top5: rows.slice(0, 5),
  },
  runId: RUN_ID,
});

await emit({
  hypothesisId: 'B',
  location: 'scripts/debug-edge-sizes.mjs:cloudflare-warning',
  message: 'cloudflare-warning-is-not-deploy-killer',
  data: {
    note: 'Vercel log showed Module not found @cloudflare/next-on-pages as compile warning; build still Completed before Deploying outputs failed on Edge size',
  },
  runId: RUN_ID,
});

await emit({
  hypothesisId: 'C',
  location: 'scripts/debug-edge-sizes.mjs:rtl',
  message: 'rtl-commit-unlikely',
  data: {
    note: 'RTL fix only touched HtmlLocaleSync + layout locale sync + providers key; deploy error names admin/playlists/[id] Edge size',
  },
  runId: RUN_ID,
});

await emit({
  hypothesisId: 'D',
  location: 'scripts/debug-edge-sizes.mjs:dnd',
  message: 'playlist-client-lazy-exists',
  data: {
    playlistTracksClientLazy: fs.existsSync(
      path.join(process.cwd(), 'app/admin/playlists/[id]/PlaylistTracksClientLazy.tsx'),
    ),
    playlistSize: playlist,
  },
  runId: RUN_ID,
});

await emit({
  hypothesisId: 'E',
  location: 'scripts/debug-edge-sizes.mjs:root-edge',
  message: 'root-layout-edge-export',
  data: {
    layoutHasEdge: fs
      .readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8')
      .includes("export const runtime = 'edge'"),
  },
  runId: RUN_ID,
});

console.error(
  `\nplaylist/[id]: ${playlist ? `${playlist.mb} MB raw / ${playlist.gzMb} MB gzip (${playlist.runtime})` : 'missing'}`,
);
console.error(`edge functions: ${edgeCount}/${rows.length}; over 1MB (raw or gzip): ${over.length}`);
