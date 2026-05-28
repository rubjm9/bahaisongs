import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { Providers } from '@/app/providers';
import { getServerThemeMode, getServerThemePreference } from '@/shared/theme/serverTheme';
import { AdminShell } from '@/features/admin/components/AdminShell';

export const metadata = {
  title: { default: 'Admin · BahaiSongs', template: '%s · Admin BahaiSongs' },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/?next=/admin');
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id' as never, session.user.id)
    .single();

  if (!profileRow || (profileRow as { role: string }).role !== 'admin') {
    redirect('/');
  }

  const { count: pendingSuggestions } = await supabase
    .from('suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('status' as never, 'pending')
    .then((r) => ({ count: r.count ?? 0 }));

  const [initialMode, themePreference] = await Promise.all([
    getServerThemeMode(),
    getServerThemePreference(),
  ]);

  return (
    <Providers initialMode={initialMode} {...(themePreference ? { themePreference } : {})}>
      <AdminShell pendingSuggestions={pendingSuggestions}>{children}</AdminShell>
    </Providers>
  );
}
