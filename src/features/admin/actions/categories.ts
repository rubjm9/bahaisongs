'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { categorySchema, type CategoryFormValues } from '../lib/schemas';

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
  return supabase;
}

export async function createCategory(values: CategoryFormValues) {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) throw new Error('Invalid data');

  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from('categories')
    .insert(parsed.data as never)
    .select('id, slug, name_es, name_en, kind')
    .single();
  if (error) throw new Error(error.message);

  revalidateTag('categories');
  revalidatePath('/admin/categories');

  return data as { id: string; slug: string; name_es: string; name_en: string; kind: string };
}

export async function updateCategory(id: string, values: Partial<CategoryFormValues>) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('categories')
    .update(values as never)
    .eq('id' as never, id);
  if (error) throw new Error(error.message);

  revalidateTag('categories');
  revalidatePath('/admin/categories');
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('categories').delete().eq('id' as never, id);
  if (error) throw new Error(error.message);

  revalidateTag('categories');
  revalidatePath('/admin/categories');
}
