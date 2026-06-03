'use client';

import { useQuery } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import type { getSupabaseBrowserClient } from '@/shared/lib/supabase/client';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import type { Profile } from '@/entities/user';

export const AUTH_QUERY_KEY = ['auth'] as const;

type SupabaseAny = ReturnType<typeof getSupabaseBrowserClient>;

interface AuthState {
  user: User | null;
  profile: Profile | null;
}

interface UseUserResult {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

async function loadProfile(
  supabase: SupabaseAny,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_path, role, locale')
    .eq('id' as never, userId)
    .single();

  if (!data) return null;

  const row = data as unknown as {
    id: string;
    display_name: string | null;
    avatar_path: string | null;
    role: string | null;
    locale: string | null;
  };

  const p: Profile = {
    id: row.id,
    role: (row.role as 'user' | 'admin') ?? 'user',
    locale: row.locale ?? 'es',
  };
  if (row.display_name) p.displayName = row.display_name;
  if (row.avatar_path) p.avatarPath = row.avatar_path;
  return p;
}

export async function fetchAuthState(): Promise<AuthState> {
  if (!supabaseEnabled) {
    return { user: null, profile: null };
  }

  const { createClient } = await import('@/shared/lib/supabase/client');
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const profile = user ? await loadProfile(supabase, user.id) : null;

  return { user, profile };
}

export function useUser(): UseUserResult {
  const { data, isPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchAuthState,
    enabled: supabaseEnabled,
    staleTime: 5 * 60_000,
  });

  const loading = supabaseEnabled && isPending;

  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    loading,
  };
}
