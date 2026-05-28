import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';

/**
 * Auth callback Route Handler — exchanges the OAuth/magic-link code for a
 * session and redirects back to the intended page (or `/` by default).
 *
 * Called automatically by Supabase after Google OAuth and magic-link flows.
 * The `next` search param carries the pre-auth destination (e.g. `/admin`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the intended page — keep origin for security.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — redirect to home with an error flag.
  return NextResponse.redirect(`${origin}/?error=auth`);
}
