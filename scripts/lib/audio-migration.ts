import type { SupabaseClient } from '@supabase/supabase-js';
import type { AwsClient } from 'aws4fetch';

/** Descarga un MP3 legacy (http→https, User-Agent para evitar 403). */
export async function downloadLegacyMp3(url: string): Promise<ArrayBuffer> {
  const normalized = url.replace(/^http:\/\//i, 'https://');
  const res = await fetch(normalized, {
    headers: {
      'User-Agent': 'BahaiSongs-ETL/1.0 (+https://bahaisongs.org)',
      Accept: 'audio/mpeg,*/*',
      Referer: 'https://bahaisongs.org/',
    },
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  return res.arrayBuffer();
}

/** True si el objeto ya existe en R2 (p. ej. subida previa sin fila en DB). */
export async function r2ObjectExists(
  aws: AwsClient,
  endpoint: string,
  bucket: string,
  key: string,
): Promise<boolean> {
  const url = `${endpoint}/${bucket}/${encodeURI(key)}`;
  const res = await aws.fetch(url, { method: 'HEAD' });
  return res.ok;
}

/**
 * Registra (o actualiza) la fuente mp3_r2 primaria de una pista.
 * No usa upsert ON CONFLICT — el schema solo tiene unique parcial en is_primary.
 */
export async function upsertPrimaryMp3Source(
  supabase: SupabaseClient,
  trackId: string,
  r2Key: string,
): Promise<void> {
  await supabase.from('track_sources').update({ is_primary: false }).eq('track_id', trackId);

  const { data: existing } = await supabase
    .from('track_sources')
    .select('id')
    .eq('track_id', trackId)
    .eq('source_ref', r2Key)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('track_sources')
      .update({ kind: 'mp3_r2', is_primary: true })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from('track_sources').insert({
    track_id: trackId,
    kind: 'mp3_r2',
    source_ref: r2Key,
    is_primary: true,
  });
  if (error) throw new Error(error.message);
}

export async function uploadMp3ToR2(
  aws: AwsClient,
  endpoint: string,
  bucket: string,
  key: string,
  body: ArrayBuffer,
): Promise<void> {
  const putUrl = `${endpoint}/${bucket}/${encodeURI(key)}`;
  const put = await aws.fetch(putUrl, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'audio/mpeg' },
  });
  if (!put.ok) throw new Error(`R2 put ${put.status}`);
}
