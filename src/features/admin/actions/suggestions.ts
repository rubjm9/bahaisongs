'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import type { SuggestionStatus } from '@/shared/lib/supabase/types';

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
  return { supabase, reviewerId: session.user.id };
}

export async function reviewSuggestion(
  id: string,
  status: Extract<SuggestionStatus, 'approved' | 'rejected'>,
  notes?: string,
) {
  const { supabase, reviewerId } = await requireAdmin();

  const { error } = await supabase
    .from('suggestions')
    .update({
      status,
      review_notes: notes ?? null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id' as never, id);

  if (error) throw new Error(error.message);

  revalidateTag('suggestions');
  revalidatePath('/admin/suggestions');
  revalidatePath('/admin');
}
