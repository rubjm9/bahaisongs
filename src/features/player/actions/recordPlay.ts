'use server';

import { hasServiceRoleKey, supabaseEnabled } from '@/shared/lib/supabase/env';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/shared/lib/supabase/server';

export async function recordPlayAction(input: {
  trackId?: string;
  slug?: string;
  source?: string;
}): Promise<{ ok: boolean }> {
  // #region agent log
  fetch('http://127.0.0.1:7856/ingest/8cec6073-f88c-47fc-b763-1794242c957e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95fed2'},body:JSON.stringify({sessionId:'95fed2',location:'recordPlay.ts:entry',message:'recordPlayAction called',data:{supabaseEnabled,hasServiceRoleKey,slug:input.slug??null,hasTrackId:Boolean(input.trackId)},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (!supabaseEnabled) {
    return { ok: false };
  }

  const sessionClient = await getSupabaseServerClient();
  let userId: string | null = null;
  try {
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Session unavailable — log as anonymous.
  }

  let trackId = input.trackId;
  if (!trackId && input.slug) {
    const lookupClient = hasServiceRoleKey ? getSupabaseServiceClient() : sessionClient;
    const { data } = await lookupClient
      .from('tracks')
      .select('id')
      .eq('slug' as never, input.slug)
      .maybeSingle();
    trackId = (data as { id: string } | null)?.id;
  }

  if (!trackId) {
    // #region agent log
    fetch('http://127.0.0.1:7856/ingest/8cec6073-f88c-47fc-b763-1794242c957e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95fed2'},body:JSON.stringify({sessionId:'95fed2',location:'recordPlay.ts:no-track',message:'skipped: trackId not resolved',data:{slug:input.slug??null},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return { ok: false };
  }

  // RLS allows anon/authenticated inserts (user_id null or auth.uid()); no service role needed.
  const { error } = await sessionClient.from('play_events').insert({
    track_id: trackId,
    user_id: userId,
    source: input.source ?? 'player',
    completion: null,
  } as never);

  if (error) {
    console.error('[recordPlayAction]', error.message);
    // #region agent log
    fetch('http://127.0.0.1:7856/ingest/8cec6073-f88c-47fc-b763-1794242c957e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95fed2'},body:JSON.stringify({sessionId:'95fed2',location:'recordPlay.ts:insert-error',message:'play_events insert failed',data:{trackId,error:error.message,usedServiceRole:false},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return { ok: false };
  }

  // #region agent log
  fetch('http://127.0.0.1:7856/ingest/8cec6073-f88c-47fc-b763-1794242c957e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'95fed2'},body:JSON.stringify({sessionId:'95fed2',location:'recordPlay.ts:ok',message:'play_events insert ok',data:{trackId,userId:userId?'set':'null',usedServiceRole:false},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  return { ok: true };
}
