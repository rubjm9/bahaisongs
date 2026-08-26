'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthChangeEvent } from '@supabase/supabase-js';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { AUTH_QUERY_KEY, fetchAuthState } from '@/features/auth/hooks/useUser';
import { track } from '@/shared/lib/analytics/track';

const INVALIDATE_EVENTS = new Set<AuthChangeEvent>([
  'INITIAL_SESSION',
  'SIGNED_IN',
  'SIGNED_OUT',
  'USER_UPDATED',
]);

/**
 * Single auth warmup + one onAuthStateChange listener for the whole app.
 * Avoids registering a listener per useUser() call (which caused refetch storms).
 */
export function AuthPrefetch() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!supabaseEnabled) return;

    let unsubscribe: (() => void) | undefined;

    void import('@/shared/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient();

      void qc.prefetchQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: fetchAuthState,
        staleTime: 5 * 60_000,
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const provider = session.user.app_metadata?.provider;
          track('login', { method: typeof provider === 'string' ? provider : 'email' });
        }
        if (!INVALIDATE_EVENTS.has(event)) return;
        void qc.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      });
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => unsubscribe?.();
  }, [qc]);

  return null;
}
