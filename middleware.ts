import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from './src/shared/lib/i18n/routing';
import { defaultLocale, locales, type Locale } from './src/shared/lib/i18n/config';
import { isReservedSegment } from './src/shared/lib/seo/track-slugs';

const intlMiddleware = createMiddleware(routing);

const LOCALE_COOKIE = 'NEXT_LOCALE';

function localeFromRequest(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) {
    return cookie as Locale;
  }
  return defaultLocale;
}

/**
 * Flat legacy song URLs (`/{slug}`) rewrite to the internal App Router path
 * while keeping the browser URL unchanged for SEO continuity.
 * Skips /admin and other reserved segments.
 */
function maybeRewriteFlatTrackUrl(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length !== 1) return null;

  const slug = segments[0]!;
  if (isReservedSegment(slug)) return null;

  const locale = localeFromRequest(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/song/${slug}`;
  return NextResponse.rewrite(url);
}

/**
 * Legacy `/song/:slug` (default locale) → flat `/:slug`.
 */
function maybeRedirectLegacySongPath(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 2 || segments[0] !== 'song') return null;

  const slug = segments[1]!;
  if (isReservedSegment(slug)) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/${slug}`;
  return NextResponse.redirect(url, 308);
}

/**
 * Supabase sometimes redirects magic links to Site URL + ?code= instead of
 * emailRedirectTo (/auth/callback). Send those to the route handler before
 * any locale rewrite or RSC page load (avoids broken client bundles on /).
 */
function maybeRedirectAuthCode(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname.startsWith('/auth/')) return null;

  const code = searchParams.get('code');
  if (!code) return null;

  const url = request.nextUrl.clone();
  url.pathname = '/auth/callback';
  return NextResponse.redirect(url);
}

/**
 * Guard for /admin/* routes. Requires an authenticated Supabase session.
 * If unauthenticated, redirects to /?next=/admin so the login modal can
 * redirect back after sign-in.
 */
async function adminGuard(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: Array<{ name: string; value: string; options: Parameters<typeof response.cookies.set>[2] }>) => {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          if (options) {
            response.cookies.set(name, value, options);
          } else {
            response.cookies.set(name, value);
          }
        }
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const authCodeRedirect = maybeRedirectAuthCode(request);
  if (authCodeRedirect) return authCodeRedirect;

  // Admin guard runs first; returns a redirect or refreshed-cookie response.
  const adminResponse = await adminGuard(request);
  if (adminResponse) return adminResponse;

  const legacySongRedirect = maybeRedirectLegacySongPath(request);
  if (legacySongRedirect) return legacySongRedirect;

  // Flat track URL rewrite (public `/{slug}` → internal song page).
  const trackRewrite = maybeRewriteFlatTrackUrl(request);
  if (trackRewrite) return trackRewrite;

  return intlMiddleware(request);
}

export const config = {
  // Exclude /auth/* — callback route lives outside [locale]; intl middleware would 404 it.
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
};
