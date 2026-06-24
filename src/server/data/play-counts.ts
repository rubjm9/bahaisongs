import 'server-only';
import { getSupabaseServiceClient } from '@/shared/lib/supabase/server';

/** Total play_events rows grouped by track_id. */
export async function getPlayCountsByTrackId(): Promise<Map<string, number>> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from('play_events').select('track_id');

  const counts = new Map<string, number>();
  if (error || !data) {
    // #region agent log
    fetch('http://127.0.0.1:7856/ingest/8cec6073-f88c-47fc-b763-1794242c957e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95fed2'},body:JSON.stringify({sessionId:'95fed2',location:'play-counts.ts:error',message:'getPlayCountsByTrackId failed',data:{error:error?.message??'no data'},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return counts;
  }

  for (const row of data as { track_id: string }[]) {
    counts.set(row.track_id, (counts.get(row.track_id) ?? 0) + 1);
  }
  // #region agent log
  fetch('http://127.0.0.1:7856/ingest/8cec6073-f88c-47fc-b763-1794242c957e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95fed2'},body:JSON.stringify({sessionId:'95fed2',location:'play-counts.ts:ok',message:'play counts loaded',data:{totalRows:data.length,uniqueTracks:counts.size,totalPlays:[...counts.values()].reduce((a,b)=>a+b,0)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return counts;
}
