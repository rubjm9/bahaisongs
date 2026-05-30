import 'server-only';

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';

function safeNextPath(raw: string | null): string {
  if (!raw?.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

/**
 * Exchanges a Supabase OAuth / magic-link code for a session and redirects
 * to the intended page (or `/` by default).
 */
export async function handleAuthCallback(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`);
}
