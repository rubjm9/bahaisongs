'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';
import { supabaseEnv } from './env';

/**
 * Browser-side Supabase client. Lazily memoised so we don't create a new
 * instance on every render.
 */
let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  cached ??= createBrowserClient<Database>(supabaseEnv.url(), supabaseEnv.anonKey());
  return cached;
}

/** Alias for hooks that follow the pattern: const supabase = createClient() */
export const createClient = getSupabaseBrowserClient;
