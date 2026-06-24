import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { transcribeFromR2Key } from '@/server/transcription';

export const runtime = 'edge';

interface TrackSourceRow {
  kind: string;
  source_ref: string;
  is_primary: boolean;
}

interface TrackRow {
  id: string;
  language: string;
  track_sources: TrackSourceRow[] | null;
}

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id' as never, session.user.id)
    .single();

  if (!profile || (profile as { role: string }).role !== 'admin') {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { supabase };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  let body: { trackId?: string };
  try {
    body = (await req.json()) as { trackId?: string };
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const trackId = body.trackId;
  if (!trackId) {
    return NextResponse.json({ error: 'missing-track-id' }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from('tracks')
    .select('id, language, track_sources (kind, source_ref, is_primary)')
    .eq('id' as never, trackId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'lookup-failed', detail: error.message }, { status: 500 });
  }

  const track = row as unknown as TrackRow | null;
  if (!track) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  const sources = track.track_sources ?? [];
  const primary =
    sources.find((s) => s.is_primary && s.kind === 'mp3_r2') ??
    sources.find((s) => s.kind === 'mp3_r2');

  if (!primary?.source_ref) {
    return NextResponse.json({ error: 'audio-unavailable' }, { status: 410 });
  }

  try {
    const mapped = await transcribeFromR2Key(primary.source_ref, { language: track.language });
    return NextResponse.json({
      plain: mapped.bodyPlain,
      synced: mapped.syncedJson,
      source: 'transcription' as const,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'transcription-failed', detail }, { status: 500 });
  }
}
