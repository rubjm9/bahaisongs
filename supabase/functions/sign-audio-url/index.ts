// supabase/functions/sign-audio-url/index.ts
// Deno Edge Function. Given a track slug, validates the track is published
// and returns a short-lived signed GET URL for its primary MP3 source in R2.
//
// Endpoint:    GET /functions/v1/sign-audio-url?track=<slug>
// Response:    200 { url, expiresAt }  | 404 unknown  | 410 audio unavailable
//
// Deploy:      supabase functions deploy sign-audio-url
// Test local:  supabase functions serve sign-audio-url --no-verify-jwt

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { AwsClient } from 'npm:aws4fetch@1.0.20';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
const R2_BUCKET_AUDIO = Deno.env.get('R2_BUCKET_AUDIO') ?? 'bahaisongs-audio';
const TTL_SECONDS = 60 * 60; // 1 hour

const aws = new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: 's3',
  region: 'auto',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const trackSlug = url.searchParams.get('track');
  if (!trackSlug) {
    return json({ error: 'missing-track-param' }, 400);
  }

  // Resolve the primary MP3 source for a published track. RLS on `tracks` and
  // `track_sources` already restricts to public read, so anon key is enough.
  const { data, error } = await supabase
    .from('tracks')
    .select('id, slug, published_at, track_sources (kind, source_ref, is_primary)')
    .eq('slug', trackSlug)
    .maybeSingle();

  if (error) return json({ error: 'lookup-failed', detail: error.message }, 500);
  if (!data || !data.published_at) return json({ error: 'not-found' }, 404);

  const sources = data.track_sources as { kind: string; source_ref: string; is_primary: boolean }[];
  const primary =
    sources.find((s) => s.is_primary && s.kind === 'mp3_r2') ??
    sources.find((s) => s.kind === 'mp3_r2');

  if (!primary) return json({ error: 'audio-unavailable' }, 410);

  const objectUrl = new URL(
    `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_AUDIO}/${encodeURI(primary.source_ref)}`,
  );
  objectUrl.searchParams.set('X-Amz-Expires', String(TTL_SECONDS));

  const signed = await aws.sign(new Request(objectUrl, { method: 'GET' }), {
    aws: { signQuery: true },
  });

  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
  return json({ url: signed.url, expiresAt }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
