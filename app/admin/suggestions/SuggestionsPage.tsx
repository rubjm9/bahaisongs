import { Box } from '@mui/material';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { AdminTopBar } from '@/features/admin/components/AdminTopBar';
import { SuggestionsClient } from './SuggestionsClient';

interface SuggestionRow {
  id: string;
  status: string;
  created_at: string;
  payload: Record<string, unknown>;
  submitter_name: string | null;
  review_notes: string | null;
  upload_path: string | null;
}

export default async function SuggestionsPage() {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from('suggestions')
    .select(`
      id, status, created_at, payload, review_notes, upload_path,
      profiles:submitted_by (display_name)
    `)
    .order('created_at' as never, { ascending: false })
    .limit(100);

  interface RawSuggestion {
    id: string;
    status: string;
    created_at: string;
    payload: Record<string, unknown>;
    review_notes: string | null;
    upload_path: string | null;
    profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  }

  const rows: SuggestionRow[] = ((data ?? []) as RawSuggestion[]).map((s) => ({
    id: s.id,
    status: s.status,
    created_at: s.created_at,
    payload: s.payload ?? {},
    review_notes: s.review_notes,
    upload_path: s.upload_path,
    submitter_name: Array.isArray(s.profiles)
      ? (s.profiles[0]?.display_name ?? null)
      : (s.profiles?.display_name ?? null),
  }));

  return (
    <>
      <AdminTopBar title="Sugerencias" />
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1280, mx: 'auto' }}>
        <SuggestionsClient initialSuggestions={rows} />
      </Box>
    </>
  );
}
