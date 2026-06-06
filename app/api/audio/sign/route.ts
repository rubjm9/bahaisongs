import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseAnonClient } from '@/shared/lib/supabase/server';
import { signedGetUrl, DEFAULT_READ_TTL_SECONDS } from '@/shared/lib/r2/signing';

export const runtime = 'edge';

function hasR2Config(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_AUDIO
  );
}

interface TrackSourceRow {
  kind: string;
  source_ref: string;
  is_primary: boolean;
}

interface TrackSignRow {
  id: string;
  slug: string;
  published_at: string | null;
  track_sources: TrackSourceRow[] | null;
}

/**
 * Signs the primary MP3 for a published track. Runs in Next.js (no Edge
 * Function required) so localhost avoids CORS and missing deploy 404s.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('track');
  if (!slug) {
    return NextResponse.json({ error: 'missing-track-param' }, { status: 400 });
  }

  if (!hasR2Config()) {
    return NextResponse.json({ error: 'r2-not-configured' }, { status: 503 });
  }

  const supabase = getSupabaseAnonClient();
  const { data: row, error } = await supabase
    .from('tracks')
    .select('id, slug, published_at, track_sources (kind, source_ref, is_primary)')
    .eq('slug' as never, slug)
    .maybeSingle();

  const data = row as unknown as TrackSignRow | null;

  if (error) {
    return NextResponse.json({ error: 'lookup-failed', detail: error.message }, { status: 500 });
  }

  if (!data?.published_at) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  const sources = data.track_sources ?? [];
  const primary =
    sources.find((s) => s.is_primary && s.kind === 'mp3_r2') ??
    sources.find((s) => s.kind === 'mp3_r2');

  if (!primary?.source_ref) {
    return NextResponse.json({ error: 'audio-unavailable' }, { status: 410 });
  }

  try {
    const bucket = process.env.R2_BUCKET_AUDIO!;
    const url = await signedGetUrl(bucket, primary.source_ref);
    const expiresAt = new Date(Date.now() + DEFAULT_READ_TTL_SECONDS * 1000).toISOString();
    return NextResponse.json({ url, expiresAt });
  } catch (signErr) {
    const detail = signErr instanceof Error ? signErr.message : String(signErr);
    return NextResponse.json({ error: 'sign-failed', detail }, { status: 500 });
  }
}
