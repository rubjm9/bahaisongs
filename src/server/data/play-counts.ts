import 'server-only';
import { getSupabaseServiceClient } from '@/shared/lib/supabase/server';

/** Total play_events rows grouped by track_id. */
export async function getPlayCountsByTrackId(): Promise<Map<string, number>> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from('play_events').select('track_id');

  const counts = new Map<string, number>();
  if (error || !data) {
    return counts;
  }

  for (const row of data as { track_id: string }[]) {
    counts.set(row.track_id, (counts.get(row.track_id) ?? 0) + 1);
  }

  return counts;
}
