import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { CategoriesClient } from './CategoriesClient';
import { AdminPage } from '@/features/admin/components/AdminPage';

export default async function CategoriesPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name_es, name_en, kind')
    .order('kind' as never)
    .order('name_es' as never);

  return (
    <AdminPage title="Categorías">
      <CategoriesClient initialCategories={data ?? []} />
    </AdminPage>
  );
}
