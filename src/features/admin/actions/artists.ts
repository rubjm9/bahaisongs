'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { artistSchema, type ArtistFormValues } from '../lib/schemas';

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

export async function createArtist(values: ArtistFormValues) {
  const parsed = artistSchema.safeParse(values);
  if (!parsed.success) throw new Error('Invalid data');

  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from('artists')
    .insert(parsed.data as never)
    .select('id, slug')
    .single();

  if (error) throw new Error(error.message);

  revalidateTag('catalog');
  revalidatePath('/admin/artists');

  return data as { id: string; slug: string };
}

export async function updateArtist(id: string, values: Partial<ArtistFormValues>) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('artists')
    .update(values as never)
    .eq('id' as never, id);
  if (error) throw new Error(error.message);

  revalidateTag('catalog');
  revalidatePath('/admin/artists');
}

export async function deleteArtist(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('artists').delete().eq('id' as never, id);
  if (error) throw new Error(error.message);

  revalidateTag('catalog');
  revalidatePath('/admin/artists');
}
