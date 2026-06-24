import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { getSupabaseBrowserClient } from '@/shared/lib/supabase/client';
import { recordPlayAction } from '../actions/recordPlay';

export interface RecordPlayEventInput {
  trackId?: string;
  slug: string;
  /** Optional context, e.g. `playlist:<uuid>`. */
  source?: string;
  completion?: number;
}

/**
 * Append a row to `play_events`. Uses the browser Supabase client (RLS allows
 * anon/authenticated inserts) so production works without a service role key.
 * Falls back to the server action if the client insert fails.
 */
export async function recordPlayEvent(input: RecordPlayEventInput): Promise<void> {
  if (!supabaseEnabled || !input.slug) return;

  try {
    const ok = await recordPlayViaBrowser(input);
    if (ok) return;

    const { ok: serverOk } = await recordPlayAction({
      slug: input.slug,
      ...(input.trackId ? { trackId: input.trackId } : {}),
      ...(input.source ? { source: input.source } : {}),
    });
    if (!serverOk) {
      console.warn('[play_events] no se pudo registrar la reproducción');
    }
  } catch (err) {
    console.warn('[play_events] record error:', err);
  }
}

async function recordPlayViaBrowser(input: RecordPlayEventInput): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();

  let trackId = input.trackId;
  if (!trackId) {
    const { data } = await supabase
      .from('tracks')
      .select('id')
      .eq('slug' as never, input.slug)
      .maybeSingle();
    trackId = (data as { id: string } | null)?.id;
  }
  if (!trackId) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('play_events').insert({
    track_id: trackId,
    user_id: user?.id ?? null,
    source: input.source ?? 'player',
    completion: input.completion ?? null,
  } as never);

  if (error) {
    console.warn('[play_events] browser insert failed:', error.message);
    return false;
  }
  return true;
}
