/**
 * Locale-prefixed alias for the auth callback.
 * next-intl middleware rewrites `/auth/callback` → `/es/auth/callback` on
 * deployments that have not yet excluded `/auth/*` from the intl matcher.
 */
export { handleAuthCallback as GET } from '@/server/auth/callback';
