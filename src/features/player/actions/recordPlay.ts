'use server';

import { hasServiceRoleKey, supabaseEnabled } from '@/shared/lib/supabase/env';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/shared/lib/supabase/server';

export async function recordPlayAction(input: {
  trackId?: string;
  slug?: string;
  source?: string;
}): Promise<{ ok: boolean }> {
  if (!supabaseEnabled || !hasServiceRoleKey) {
    return { ok: false };
  }

  const service = getSupabaseServiceClient();
  let trackId = input.trackId;

  if (!trackId && input.slug) {
    const { data } = await service
      .from('tracks')
      .select('id')
      .eq('slug' as never, input.slug)
      .maybeSingle();
    trackId = (data as { id: string } | null)?.id;
  }

  if (!trackId) return { ok: false };

  let userId: string | null = null;
  try {
    const sessionClient = await getSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Session unavailable — log as anonymous.
  }

  const { error } = await service.from('play_events').insert({
    track_id: trackId,
    user_id: userId,
    source: input.source ?? 'player',
    completion: null,
  } as never);

  if (error) {
    console.error('[recordPlayAction]', error.message);
    return { ok: false };
  }

  return { ok: true };
}
