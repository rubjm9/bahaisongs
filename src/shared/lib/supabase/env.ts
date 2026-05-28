/**
 * Centralised access to Supabase environment variables.
 * Throws early at module load if required vars are missing so we fail fast
 * during build / SSR instead of producing cryptic runtime errors.
 */

function required(name: string): string {
  const v =
    name === 'NEXT_PUBLIC_SUPABASE_URL'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        : process.env[name];
  if (!v) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to .env.local (see .env.example).`,
    );
  }
  return v;
}

export const supabaseEnv = {
  url: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  /** Server-only. Never expose to the client bundle. */
  serviceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
} as const;

/** True when the Supabase public URL env var is present. */
export const supabaseEnabled =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0;
