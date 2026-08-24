'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { useUser } from '@/features/auth/hooks/useUser';
import { resolveTrackUuid } from '@/features/playlists/lib/playlist-tracks';

const LS_KEY = 'bs_likes';

function readLocalLikes(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeLocalLikes(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
}

function slugFromLikeJoin(tracks: unknown): string | null {
  if (!tracks) return null;
  if (Array.isArray(tracks)) {
    const first = tracks[0] as { slug?: string } | undefined;
    return typeof first?.slug === 'string' ? first.slug : null;
  }
  const slug = (tracks as { slug?: string }).slug;
  return typeof slug === 'string' ? slug : null;
}

function toggleInSet(ids: Set<string>, trackId: string): Set<string> {
  const next = new Set(ids);
  if (next.has(trackId)) next.delete(trackId);
  else next.add(trackId);
  return next;
}

export function useLikes() {
  const { user, loading: userLoading } = useUser();
  const qc = useQueryClient();

  const queryKey = ['likes', user?.id ?? 'anonymous'];

  const { data: likedIds = new Set<string>(), isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Set<string>> => {
      if (!supabaseEnabled || !user) {
        return readLocalLikes();
      }
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();

      const local = readLocalLikes();
      for (const slugOrId of local) {
        const trackUuid = await resolveTrackUuid(supabase, slugOrId);
        if (!trackUuid) continue;
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, track_id: trackUuid } as never);
        if (error && error.code !== '23505') {
          throw new Error(error.message);
        }
      }
      if (local.size > 0) writeLocalLikes(new Set());

      const { data, error } = await supabase
        .from('likes')
        .select('track_id, tracks(slug)')
        .eq('user_id' as never, user.id);
      if (error) throw new Error(error.message);
      const slugs = (data as unknown as { tracks: unknown }[])
        .map((r) => slugFromLikeJoin(r.tracks))
        .filter((slug): slug is string => slug !== null);
      return new Set(slugs);
    },
    enabled: !userLoading,
    staleTime: 30_000,
  });

  const { mutate: toggle } = useMutation<Set<string>, Error, string, { prev?: Set<string> }>({
    mutationFn: async (trackId: string): Promise<Set<string>> => {
      const current = likedIds;
      const isLiked = current.has(trackId);

      if (!supabaseEnabled || !user) {
        const next = toggleInSet(current, trackId);
        writeLocalLikes(next);
        return next;
      }

      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const trackUuid = await resolveTrackUuid(supabase, trackId);
      if (!trackUuid) {
        throw new Error('Track not found');
      }

      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id' as never, user.id)
          .eq('track_id' as never, trackUuid);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, track_id: trackUuid } as never);
        if (error && error.code !== '23505') throw new Error(error.message);
      }

      return toggleInSet(current, trackId);
    },
    onMutate: async (trackId: string) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Set<string>>(queryKey);
      qc.setQueryData(queryKey, toggleInSet(prev ?? new Set<string>(), trackId));
      return prev ? { prev } : {};
    },
    onError: (_err: Error, _id: string, ctx?: { prev?: Set<string> }) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  return {
    likedIds,
    toggle: (trackId: string) => toggle(trackId),
    loading: isLoading || userLoading,
  };
}
