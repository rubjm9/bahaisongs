'use client';

import { useState } from 'react';
import { supabaseEnabled } from '@/shared/lib/supabase/env';

interface UseSignInResult {
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

function buildAuthCallbackUrl(): string {
  const callback = new URL('/auth/callback', window.location.origin);
  const next = new URLSearchParams(window.location.search).get('next');
  if (next?.startsWith('/') && !next.startsWith('//')) {
    callback.searchParams.set('next', next);
  }
  return callback.toString();
}

export function useSignIn(): UseSignInResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    if (!supabaseEnabled) return;
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: buildAuthCallbackUrl() },
      });
      if (err) setError(err.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function signInWithMagicLink(email: string) {
    if (!supabaseEnabled) return;
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: buildAuthCallbackUrl() },
      });
      if (err) setError(err.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    if (!supabaseEnabled) return;
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const { error: err } = await supabase.auth.signOut();
      if (err) setError(err.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return { signInWithGoogle, signInWithMagicLink, signOut, loading, error };
}
