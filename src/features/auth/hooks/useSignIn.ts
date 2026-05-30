'use client';

import { useState } from 'react';
import { authGoogleEnabled } from '@/shared/lib/supabase/auth-config';
import { supabaseEnabled } from '@/shared/lib/supabase/env';

interface UseSignInResult {
  signInWithGoogle: () => Promise<boolean>;
  signInWithMagicLink: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
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

  function clearError() {
    setError(null);
  }

  async function signInWithGoogle(): Promise<boolean> {
    if (!supabaseEnabled) return false;
    if (!authGoogleEnabled) {
      setError('provider_disabled');
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: buildAuthCallbackUrl() },
      });
      if (err) {
        setError(normalizeAuthError(err.message));
        return false;
      }
      return true;
    } catch (e) {
      setError(normalizeAuthError(e instanceof Error ? e.message : 'unknown'));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signInWithMagicLink(email: string): Promise<boolean> {
    if (!supabaseEnabled) return false;
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: buildAuthCallbackUrl() },
      });
      if (err) {
        setError(normalizeAuthError(err.message));
        return false;
      }
      return true;
    } catch (e) {
      setError(normalizeAuthError(e instanceof Error ? e.message : 'unknown'));
      return false;
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

  return { signInWithGoogle, signInWithMagicLink, signOut, loading, error, clearError };
}

function normalizeAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('provider is not enabled') || lower.includes('unsupported provider')) {
    return 'provider_disabled';
  }
  return message;
}
