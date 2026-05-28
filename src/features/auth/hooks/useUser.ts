'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { getSupabaseBrowserClient } from '@/shared/lib/supabase/client';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import type { Profile } from '@/entities/user';

type SupabaseAny = ReturnType<typeof getSupabaseBrowserClient>;

interface UseUserResult {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

async function loadProfile(
  supabase: SupabaseAny,
  userId: string,
  active: { current: boolean },
): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_path, role, locale')
    .eq('id' as never, userId)
    .single();

  if (!active.current || !data) return null;

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

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(supabaseEnabled);

  useEffect(() => {
    if (!supabaseEnabled) return;

    const activeRef = { current: true };

    async function init(): Promise<() => void> {
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      let unsubscribe: (() => void) | null = null;

      if (activeRef.current) {
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await loadProfile(supabase, session.user.id, activeRef);
          if (p && activeRef.current) setProfile(p);
        }
        setLoading(false);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, sess) => {
          if (!activeRef.current) return;
          setUser(sess?.user ?? null);
          if (sess?.user) {
            void loadProfile(supabase, sess.user.id, activeRef).then((p) => {
              if (p && activeRef.current) setProfile(p);
            });
          } else {
            setProfile(null);
          }
          setLoading(false);
        });

        unsubscribe = () => subscription.unsubscribe();
      }

      return () => unsubscribe?.();
    }

    let cleanup: (() => void) | undefined;
    void init().then((fn) => {
      cleanup = fn;
    });

    return () => {
      activeRef.current = false;
      cleanup?.();
    };
  }, []);

  return { user, profile, loading };
}
