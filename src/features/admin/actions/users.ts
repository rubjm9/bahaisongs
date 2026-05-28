'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServiceClient } from '@/shared/lib/supabase/server';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import type { UserRole } from '@/shared/lib/supabase/types';

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id' as never, session.user.id)
    .single();

  if (!profile || (profile as { role: string }).role !== 'admin') {
    throw new Error('Forbidden');
  }

  return { supabase, callerId: session.user.id };
}

export async function setUserRole(userId: string, role: UserRole) {
  const { callerId } = await requireAdmin();

  if (userId === callerId) {
    throw new Error('No puedes cambiar tu propio rol');
  }

  // Use service client to update role (bypasses RLS safely for admin action)
  const service = getSupabaseServiceClient();
  const { error } = await service
    .from('profiles')
    .update({ role } as never)
    .eq('id' as never, userId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
}
