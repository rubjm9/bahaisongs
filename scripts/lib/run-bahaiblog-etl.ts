/**
 * Upsert Baha'i Blog YouTube batch into Supabase. Idempotent.
 */

import { createClient } from '@supabase/supabase-js';
import type { BahaiblogNormalizedTrack } from './bahaiblog';

const EXTRA_CATEGORIES: { slug: string; name_es: string; name_en: string; kind: string }[] = [
  { slug: 'bahaiblog-studio', name_es: "Baha'i Blog studio", name_en: "Baha'i Blog studio", kind: 'tag' },
  {
    slug: 'bahaiblog-recording',
    name_es: "Baha'i Blog recording artist",
    name_en: "Baha'i Blog recording artist",
    kind: 'tag',
  },
  {
    slug: 'bahaiblog-community',
    name_es: "Baha'i Blog community",
    name_en: "Baha'i Blog community",
    kind: 'tag',
  },
  { slug: 'bahaiblog-hip-hop', name_es: "Baha'i Blog hip hop", name_en: "Baha'i Blog hip hop", kind: 'tag' },
];

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function runBahaiblogEtl(tracks: readonly BahaiblogNormalizedTrack[]): Promise<void> {
  const supabase = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const cat of EXTRA_CATEGORIES) {
    await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
  }

  const { data: catRows, error: catErr } = await supabase.from('categories').select('id, slug');
  if (catErr || !catRows) throw new Error(`Categories load failed: ${catErr?.message ?? '?'}`);
  const catBySlug = new Map<string, string>(
    (catRows as { id: string; slug: string }[]).map((c) => [c.slug, c.id]),
  );

  const artistCache = new Map<string, string>();
  let ok = 0;

  for (const t of tracks) {
    let artistId = artistCache.get(t.artistSlug);
    if (!artistId) {
      const { data: artistRow, error: artistErr } = await supabase
        .from('artists')
        .upsert({ slug: t.artistSlug, name: t.artistName }, { onConflict: 'slug' })
        .select('id')
        .single();
      if (artistErr || !artistRow) {
        console.warn(`  ✗ artist ${t.artistSlug}: ${artistErr?.message ?? '?'}`);
        continue;
      }
      artistId = artistRow.id as string;
      artistCache.set(t.artistSlug, artistId);
    }

    const { data: trackRow, error: trackErr } = await supabase
      .from('tracks')
      .upsert(
        {
          slug: t.slug,
          title: t.title,
          language: t.language,
          published_at: new Date().toISOString(),
          primary_artist_id: artistId,
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

    await supabase.from('track_sources').update({ is_primary: false }).eq('track_id', trackId);

    const { data: existingYt } = await supabase
      .from('track_sources')
      .select('id')
      .eq('track_id', trackId)
      .eq('kind', 'youtube')
      .maybeSingle();

    if (existingYt) {
      const { error: srcErr } = await supabase
        .from('track_sources')
        .update({ source_ref: t.youtubeId, is_primary: true })
        .eq('id', (existingYt as { id: string }).id);
      if (srcErr) console.warn(`  ⚠ source ${t.slug}: ${srcErr.message}`);
    } else {
      const { error: srcErr } = await supabase.from('track_sources').insert({
        track_id: trackId,
        kind: 'youtube',
        source_ref: t.youtubeId,
        is_primary: true,
      });
      if (srcErr) console.warn(`  ⚠ source ${t.slug}: ${srcErr.message}`);
    }

    if (t.lyricsPlain) {
      const { error: lyrErr } = await supabase.from('lyrics').upsert(
        {
          track_id: trackId,
          locale: t.language,
          body_plain: t.lyricsPlain,
          body_chordpro: null,
          has_chords: t.hasChords,
          source: 'bahaiblog',
        },
        { onConflict: 'track_id,locale' },
      );
      if (lyrErr) console.warn(`  ⚠ lyrics ${t.slug}: ${lyrErr.message}`);
    }

    await supabase.from('track_categories').delete().eq('track_id', trackId);
    const catRows = t.categorySlugs
      .map((slug) => catBySlug.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((category_id) => ({ track_id: trackId, category_id }));
    if (catRows.length > 0) {
      const { error: tcErr } = await supabase.from('track_categories').insert(catRows);
      if (tcErr) console.warn(`  ⚠ categories ${t.slug}: ${tcErr.message}`);
    }

    ok++;
    console.log(`  ✓ ${t.slug}`);
  }

  console.log(`\nBaha'i Blog ETL complete: ${ok}/${tracks.length} tracks upserted.`);
}
