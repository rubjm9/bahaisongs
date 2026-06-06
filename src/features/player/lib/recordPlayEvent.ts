import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { recordPlayAction } from '../actions/recordPlay';

export interface RecordPlayEventInput {
  trackId?: string;
  slug: string;
  /** Optional context, e.g. `playlist:<uuid>`. */
  source?: string;
  completion?: number;
}

/**
 * Append a row to `play_events` via a server action (service role). Counts as
 * soon as playback starts — no minimum listen duration. Fire-and-forget.
 */
export async function recordPlayEvent(input: RecordPlayEventInput): Promise<void> {
  if (!supabaseEnabled || !input.slug) return;

  try {
    const { ok } = await recordPlayAction({
      slug: input.slug,
      ...(input.trackId ? { trackId: input.trackId } : {}),
      ...(input.source ? { source: input.source } : {}),
    });
    if (!ok) {
      console.warn('[play_events] no se pudo registrar la reproducción');
    }
  } catch (err) {
    console.warn('[play_events] record error:', err);
  }
}
