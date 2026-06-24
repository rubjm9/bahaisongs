#!/usr/bin/env -S npx tsx
/**
 * scripts/transcribe-lyrics.ts
 *
 * Transcribe lyrics from MP3 files stored in R2 using a local Whisper CLI.
 * Writes body_plain + synced_json to Supabase as draft (source = transcription).
 *
 * Requiere: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *           R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_AUDIO
 *           faster-whisper o whisper CLI instalado localmente
 *
 * Uso:
 *   npm run etl:transcribe:dry
 *   npm run etl:transcribe
 *   npm run etl:transcribe -- --force
 *   npm run etl:transcribe -- --limit 5
 */

import { parseArgs } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { loadAudioFromR2, mapToLyrics, transcribeWithLocalCli } from '../src/server/transcription';

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

interface CliOpts {
  dryRun: boolean;
  force: boolean;
  limit: number | undefined;
}

function parseCli(): CliOpts {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      limit: { type: 'string' },
    },
    allowPositionals: true,
    strict: false,
  });
  return {
    dryRun: values['dry-run'] ?? false,
    force: values.force ?? false,
    limit: values.limit ? Number(values.limit) : undefined,
  };
}

interface TrackRow {
  id: string;
  slug: string;
  title: string;
  language: string;
  track_sources: { kind: string; source_ref: string; is_primary: boolean }[] | null;
  lyrics: { locale: string; body_plain: string | null; synced_json: unknown }[] | null;
}

async function main(): Promise<void> {
  const opts = parseCli();

  const supabase = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('tracks')
    .select(`
      id, slug, title, language,
      track_sources (kind, source_ref, is_primary),
      lyrics (locale, body_plain, synced_json)
    `)
    .not('published_at' as never, 'is', null)
    .order('title' as never);

  if (error || !data) throw new Error(error?.message ?? 'No se pudieron cargar pistas');

  const tracks = (data as unknown as TrackRow[]).filter((track) => {
    const sources = track.track_sources ?? [];
    return sources.some((s) => s.kind === 'mp3_r2');
  });

  console.log(`Pistas con MP3 en R2: ${tracks.length}\n`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const track of tracks) {
    if (opts.limit !== undefined && processed >= opts.limit) break;

    const sources = track.track_sources ?? [];
    const primary =
      sources.find((s) => s.is_primary && s.kind === 'mp3_r2') ??
      sources.find((s) => s.kind === 'mp3_r2');

    if (!primary?.source_ref) {
      skipped++;
      continue;
    }

    const existingLyrics = (track.lyrics ?? []).find((l) => l.locale === track.language);
    if (!opts.force && existingLyrics?.body_plain?.trim()) {
      console.log(`  ⊘ ${track.slug} — ya tiene letra`);
      skipped++;
      continue;
    }

    if (opts.dryRun) {
      console.log(`  → ${track.slug} — transcribiría desde ${primary.source_ref}`);
      processed++;
      continue;
    }

    try {
      console.log(`  … ${track.slug}`);
      const audio = await loadAudioFromR2(primary.source_ref, null);
      const result = await transcribeWithLocalCli(audio, track.language);
      const mapped = mapToLyrics(result);

      const { error: upsertErr } = await supabase.from('lyrics').upsert(
        {
          track_id: track.id,
          locale: track.language,
          body_plain: mapped.bodyPlain,
          synced_json: mapped.syncedJson,
          has_chords: false,
          source: 'transcription',
        },
        { onConflict: 'track_id,locale' },
      );

      if (upsertErr) throw new Error(upsertErr.message);
      console.log(`  ✓ ${track.slug} — ${mapped.syncedJson.length} líneas sincronizadas`);
      processed++;
    } catch (err) {
      failed++;
      console.warn(`  ✗ ${track.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nResumen: ${processed} procesadas, ${skipped} omitidas, ${failed} fallidas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
