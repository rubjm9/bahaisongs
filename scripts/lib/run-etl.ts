/**
 * Real-mode ETL pipeline. Loaded lazily by `import-wordpress.ts` so the
 * dry-run path does not require Supabase / R2 env vars.
 *
 * What it does, in order:
 *   1. Upserts the generic "Comunidad Bahá'í" artist as the default author.
 *   2. For each parsed track, upserts the `tracks` row (by slug).
 *   3. For each track with chord hints or audio, upserts the lyrics row
 *      (locale = track.language). `body_chordpro` is intentionally left null
 *      until ChordPro authoring happens — only `body_plain` and `has_chords`
 *      are set.
 *   4. Reconciles `track_categories` against the catalogue's seed taxonomy.
 *   5. When `noAudio` is false and an enclosure URL is present, downloads the
 *      MP3 from `canciones.bahai.es` and PUTs it to R2 under
 *      `audio/{trackId}/legacy.mp3`. Then upserts `track_sources` with
 *      `kind = 'mp3_r2'` and `is_primary = true`.
 *
 * Idempotent — safe to re-run. Uses `slug` as the natural key for upserts.
 */

import { createClient } from '@supabase/supabase-js';
import { AwsClient } from 'aws4fetch';
import type { ParsedTrack } from './wordpress-parser';
import {
  downloadLegacyMp3,
  uploadMp3ToR2,
  upsertPrimaryMp3Source,
} from './audio-migration';

const DEFAULT_ARTIST_SLUG = 'comunidad-bahai';
const DEFAULT_ARTIST_NAME = "Comunidad Bahá'í";

interface RunOpts {
  noAudio: boolean;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function runEtl(tracks: readonly ParsedTrack[], opts: RunOpts): Promise<void> {
  const supabaseUrl = env('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = env('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Default artist
  const { data: artistRow, error: artistErr } = await supabase
    .from('artists')
    .upsert(
      { slug: DEFAULT_ARTIST_SLUG, name: DEFAULT_ARTIST_NAME },
      { onConflict: 'slug', ignoreDuplicates: false },
    )
    .select('id')
    .single();
  if (artistErr || !artistRow)
    throw new Error(`Artist upsert failed: ${artistErr?.message ?? '?'}`);
  const defaultArtistId = artistRow.id as string;

  // Resolve all seeded categories once.
  const { data: catRows, error: catErr } = await supabase.from('categories').select('id, slug');
  if (catErr || !catRows) throw new Error(`Categories load failed: ${catErr?.message ?? '?'}`);
  const catBySlug = new Map<string, string>(
    (catRows as { id: string; slug: string }[]).map((c) => [c.slug, c.id]),
  );

  // R2 client only when needed
  const aws = opts.noAudio
    ? null
    : new AwsClient({
        accessKeyId: env('R2_ACCESS_KEY_ID'),
        secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
        service: 's3',
        region: 'auto',
      });
  const r2Endpoint = opts.noAudio ? '' : `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`;
  const r2Bucket = opts.noAudio ? '' : env('R2_BUCKET_AUDIO');

  let ok = 0;
  let audioOk = 0;
  let audioFail = 0;

  for (const t of tracks) {
    // 2. Track upsert
    const { data: trackRow, error: trackErr } = await supabase
      .from('tracks')
      .upsert(
        {
          slug: t.slug,
          title: t.title,
          language: t.language,
          published_at: t.publishedAt,
          primary_artist_id: defaultArtistId,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single();
    if (trackErr || !trackRow) {
      console.warn(`  ✗ track ${t.slug}: ${trackErr?.message ?? '?'}`);
      continue;
    }
    const trackId = trackRow.id as string;

    // 3. Lyrics upsert (plain text only — chordpro is admin-authored later)
    if (t.lyricsPlain) {
      const { error: lyrErr } = await supabase.from('lyrics').upsert(
        {
          track_id: trackId,
          locale: t.language,
          body_plain: t.lyricsPlain,
          body_chordpro: null,
          has_chords: t.hasChords,
          source: 'wordpress',
        },
        { onConflict: 'track_id,locale' },
      );
      if (lyrErr) console.warn(`  ⚠ lyrics ${t.slug}: ${lyrErr.message}`);
    }

    // 4. Categories
    await supabase.from('track_categories').delete().eq('track_id', trackId);
    const rows = t.categorySlugs
      .map((slug) => catBySlug.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((category_id) => ({ track_id: trackId, category_id }));
    if (rows.length > 0) {
      const { error: tcErr } = await supabase.from('track_categories').insert(rows);
      if (tcErr) console.warn(`  ⚠ categories ${t.slug}: ${tcErr.message}`);
    }

    // 5. Audio migration (canciones.bahai.es → R2)
    if (!opts.noAudio && aws && t.enclosureUrl) {
      try {
        const r2Key = `audio/${trackId}/legacy.mp3`;
        const buf = await downloadLegacyMp3(t.enclosureUrl);
        await uploadMp3ToR2(aws, r2Endpoint, r2Bucket, r2Key, buf);
        await upsertPrimaryMp3Source(supabase, trackId, r2Key);
        audioOk++;
      } catch (err) {
        audioFail++;
        console.warn(`  ⚠ audio ${t.slug}: ${(err as Error).message}`);
      }
    }

    ok++;
  }

  console.log(`\nETL complete: ${ok}/${tracks.length} tracks upserted.`);
  if (!opts.noAudio) {
    console.log(`Audio: ${audioOk} migrated, ${audioFail} failed.`);
  }
}
