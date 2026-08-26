import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { getSupabaseBrowserClient } from '@/shared/lib/supabase/client';
import { recordPlayAction, updatePlayCompletionAction } from '../actions/recordPlay';

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
 * Returns the inserted event id when available (for completion updates).
 */
export async function recordPlayEvent(input: RecordPlayEventInput): Promise<string | null> {
  if (!supabaseEnabled || !input.slug) return null;

  try {
    const eventId = await recordPlayViaBrowser(input);
    if (eventId) return eventId;

    const { ok, eventId: serverEventId } = await recordPlayAction({
      slug: input.slug,
      ...(input.trackId ? { trackId: input.trackId } : {}),
      ...(input.source ? { source: input.source } : {}),
    });
    if (!ok) {
      console.warn('[play_events] no se pudo registrar la reproducción');
    }
    return serverEventId ?? null;
  } catch (err) {
    console.warn('[play_events] record error:', err);
    return null;
  }
}

export async function updatePlayCompletion(input: {
  eventId: string;
  completion: number;
}): Promise<void> {
  if (!supabaseEnabled || !input.eventId) return;

  try {
    const { ok } = await updatePlayCompletionAction(input);
    if (!ok) {
      console.warn('[play_events] no se pudo actualizar completion');
    }
  } catch (err) {
    console.warn('[play_events] completion update error:', err);
  }
}

async function recordPlayViaBrowser(input: RecordPlayEventInput): Promise<string | null> {
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
  if (!trackId) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('play_events')
    .insert({
      track_id: trackId,
      user_id: user?.id ?? null,
      source: input.source ?? 'player',
      completion: input.completion ?? null,
    } as never)
    .select('id')
    .single();

  if (error) {
    console.warn('[play_events] browser insert failed:', error.message);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}
