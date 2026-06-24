import { getSupabaseServiceClient } from '@/shared/lib/supabase/server';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { hasServiceRoleKey } from '@/shared/lib/supabase/env';
import { AdminPage } from '@/features/admin/components/AdminPage';
import { UsersClient } from './UsersClient';

interface UserRow {
  id: string;
  display_name: string | null;
  role: string;
  locale: string;
  created_at: string;
  email?: string | null;
}

export default async function UsersPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, role, locale, created_at')
    .order('created_at' as never, { ascending: false })
    .limit(200);

  const emailMap = new Map<string, string>();
  if (hasServiceRoleKey) {
    const service = getSupabaseServiceClient();
    const { data: authUsers } = await service.auth.admin.listUsers();
    for (const u of authUsers?.users ?? []) {
      emailMap.set(u.id, u.email ?? '');
    }
  }

  interface ProfileRow { id: string; display_name: string | null; role: string; locale: string; created_at: string }

  const rows: UserRow[] = ((profiles ?? []) as ProfileRow[]).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? null,
  }));

  return (
    <AdminPage title="Usuarios">
      <UsersClient initialUsers={rows} currentUserId={session?.user.id ?? ''} />
    </AdminPage>
  );
}
