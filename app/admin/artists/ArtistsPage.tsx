import { Box } from '@mui/material';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { AdminTopBar } from '@/features/admin/components/AdminTopBar';
import { ArtistsClient } from './ArtistsClient';

export default async function ArtistsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: artists } = await supabase
    .from('artists')
    .select('id, slug, name, bio, country')
    .order('name' as never);

  return (
    <>
      <AdminTopBar title="Artistas" />
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1280, mx: 'auto' }}>
        <ArtistsClient
          initialArtists={artists ?? []}
        />
      </Box>
    </>
  );
}
