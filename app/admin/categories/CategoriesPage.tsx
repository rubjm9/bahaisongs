import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { CategoriesClient } from './CategoriesClient';
import { AdminTopBar } from '@/features/admin/components/AdminTopBar';
import { Box } from '@mui/material';


export default async function CategoriesPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('categories')
    .select('id, slug, name_es, name_en, kind')
    .order('kind' as never)
    .order('name_es' as never);

  return (
    <>
      <AdminTopBar title="Categorías" />
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1280, mx: 'auto' }}>
        <CategoriesClient initialCategories={data ?? []} />
      </Box>
    </>
  );
}
