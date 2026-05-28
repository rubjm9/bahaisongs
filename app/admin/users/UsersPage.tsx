import { Box } from '@mui/material';
import { getSupabaseServiceClient } from '@/shared/lib/supabase/server';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { AdminTopBar } from '@/features/admin/components/AdminTopBar';
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

  // Fetch emails using the service role (only accessible server-side)
  const service = getSupabaseServiceClient();
  const { data: authUsers } = await service.auth.admin.listUsers();
  const emailMap = new Map<string, string>();
  for (const u of authUsers?.users ?? []) {
    emailMap.set(u.id, u.email ?? '');
  }

  interface ProfileRow { id: string; display_name: string | null; role: string; locale: string; created_at: string }

  const rows: UserRow[] = ((profiles ?? []) as ProfileRow[]).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? null,
  }));

  return (
    <>
      <AdminTopBar title="Usuarios" />
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1280, mx: 'auto' }}>
        <UsersClient initialUsers={rows} currentUserId={session?.user.id ?? ''} />
      </Box>
    </>
  );
}
