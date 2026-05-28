import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './types';
import { supabaseEnv } from './env';

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Supabase client for React Server Components, Route Handlers and Server
 * Actions. Reads/writes the auth cookies via `next/headers`.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseEnv.url(), supabaseEnv.anonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The `setAll` method was called from a Server Component. This can be
          // ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Stateless anonymous client — no cookies, no session. Safe to use inside
 * `unstable_cache` callbacks and other contexts where `cookies()` is not
 * available (e.g. generateStaticParams, cached data fetchers).
 * Public data subject to RLS public-read policies is accessible.
 */
export function getSupabaseAnonClient() {
  return createServerClient<Database>(supabaseEnv.url(), supabaseEnv.anonKey(), {
    cookies: { getAll: () => [], setAll: () => undefined },
  });
}

/**
 * Privileged server client using the service role key. Use ONLY inside Server
 * Actions / Route Handlers that explicitly need to bypass RLS (e.g. moving a
 * suggestion to approved). Never expose this to the browser.
 */
export function getSupabaseServiceClient() {
  return createServerClient<Database>(supabaseEnv.url(), supabaseEnv.serviceRoleKey(), {
    cookies: {
      getAll: () => [],
      setAll: () => undefined,
    },
  });
}
