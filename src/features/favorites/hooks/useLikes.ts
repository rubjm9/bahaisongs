'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { useUser } from '@/features/auth/hooks/useUser';

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
      const { data, error } = await supabase
        .from('likes')
        .select('track_id')
        .eq('user_id' as never, user.id);
      if (error) return new Set();
      return new Set((data as unknown as { track_id: string }[]).map((r) => r.track_id));
    },
    enabled: !userLoading,
    staleTime: 30_000,
  });

  const { mutate: toggle } = useMutation<Set<string>, Error, string, { prev?: Set<string> }>({
    mutationFn: async (trackId: string): Promise<Set<string>> => {
      const current = likedIds;
      const isLiked = current.has(trackId);

      if (!supabaseEnabled || !user) {
        const next = new Set(current);
        if (isLiked) next.delete(trackId);
        else next.add(trackId);
        writeLocalLikes(next);
        return next;
      }

      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();

      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id' as never, user.id)
          .eq('track_id' as never, trackId);
      } else {
        await supabase.from('likes').insert({ user_id: user.id, track_id: trackId } as never);
      }

      const next = new Set(current);
      if (isLiked) next.delete(trackId);
      else next.add(trackId);
      return next;
    },
    onMutate: async (trackId: string) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<Set<string>>(queryKey);
      const next = new Set(prev ?? new Set<string>());
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      qc.setQueryData(queryKey, next);
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
