#!/usr/bin/env -S npx tsx
/**
 * scripts/migrate-audio-r2.ts
 *
 * Migra solo el audio: descarga MP3 legacy → R2 → track_sources.
 * Idempotente. Omite pistas que ya tienen una fuente mp3_r2 primaria.
 *
 * Requiere: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *           R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_AUDIO
 *
 * Uso:
 *   npm run etl:audio
 *   npm run etl:audio -- --limit 5    # probar con pocas pistas
 *   npm run etl:audio -- --dry-run    # listar qué se migraría
 */

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { AwsClient } from 'aws4fetch';
import { parseWordpressExport } from './lib/wordpress-parser';
import {
  downloadLegacyMp3,
  r2ObjectExists,
  uploadMp3ToR2,
  upsertPrimaryMp3Source,
} from './lib/audio-migration';

const XML_PATH = resolve(__dirname, 'data', 'wordpress-export.xml');

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

interface CliOpts {
  dryRun: boolean;
  limit: number | undefined;
}

function parseCli(): CliOpts {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      limit: { type: 'string' },
    },
    allowPositionals: true,
    strict: false,
  });
  return {
    dryRun: values['dry-run'] ?? false,
    limit: values.limit ? Number(values.limit) : undefined,
  };
}

async function main(): Promise<void> {
  const opts = parseCli();

  console.log(`Parsing ${XML_PATH} …`);
  const parsed = await parseWordpressExport(XML_PATH);
  const withAudio = parsed.filter((t) => t.enclosureUrl);
  console.log(`  ${withAudio.length} tracks with legacy MP3 URLs\n`);

  const supabase = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const aws = new AwsClient({
    accessKeyId: env('R2_ACCESS_KEY_ID'),
    secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
    service: 's3',
    region: 'auto',
  });
  const r2Endpoint = `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`;
  const r2Bucket = env('R2_BUCKET_AUDIO');

  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  const toProcess = opts.limit ? withAudio.slice(0, opts.limit) : withAudio;

  for (const t of toProcess) {
    const { data: trackRow, error: trackErr } = await supabase
      .from('tracks')
      .select('id')
      .eq('slug', t.slug)
      .maybeSingle();

    if (trackErr || !trackRow) {
      console.warn(`  ⚠ ${t.slug}: track not in DB, skipping`);
      skipped++;
      continue;
    }
    const trackId = trackRow.id as string;

    const { data: existing } = await supabase
      .from('track_sources')
      .select('id')
      .eq('track_id', trackId)
      .eq('kind', 'mp3_r2')
      .eq('is_primary', true)
      .maybeSingle();

    if (existing) {
      console.log(`  ○ ${t.slug}: already migrated`);
      skipped++;
      continue;
    }

    if (opts.dryRun) {
      console.log(`  → ${t.slug}: would migrate from ${t.enclosureUrl}`);
      migrated++;
      continue;
    }

    try {
      const r2Key = `audio/${trackId}/legacy.mp3`;
      const alreadyInR2 = await r2ObjectExists(aws, r2Endpoint, r2Bucket, r2Key);

      if (!alreadyInR2) {
        const buf = await downloadLegacyMp3(t.enclosureUrl!);
        await uploadMp3ToR2(aws, r2Endpoint, r2Bucket, r2Key, buf);
      }

      await upsertPrimaryMp3Source(supabase, trackId, r2Key);

      console.log(`  ✓ ${t.slug}${alreadyInR2 ? ' (R2 ok, DB registrado)' : ''}`);
      migrated++;
    } catch (err) {
      console.warn(`  ✗ ${t.slug}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped, ${failed} failed.`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
