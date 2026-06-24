import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { AdminPage } from '@/features/admin/components/AdminPage';
import { ArtistsClient } from './ArtistsClient';

export default async function ArtistsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: artists } = await supabase
    .from('artists')
    .select('id, slug, name, bio, country')
    .order('name' as never);

  return (
    <AdminPage title="Artistas">
      <ArtistsClient initialArtists={artists ?? []} />
    </AdminPage>
  );
}
