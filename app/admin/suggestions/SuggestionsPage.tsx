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
  submitter_email: string | null;
  review_notes: string | null;
  upload_path: string | null;
}

function resolveSubmitterName(
  profileName: string | null,
  submitterName: string | null,
  submitterEmail: string | null,
): string {
  return profileName ?? submitterName ?? submitterEmail ?? 'Anónimo';
}

export default async function SuggestionsPage() {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from('suggestions')
    .select(`
      id, status, created_at, payload, review_notes, upload_path,
      submitter_name, submitter_email,
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
    submitter_name: string | null;
    submitter_email: string | null;
    profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  }

  const rows: SuggestionRow[] = ((data ?? []) as RawSuggestion[]).map((s) => {
    const profileName = Array.isArray(s.profiles)
      ? (s.profiles[0]?.display_name ?? null)
      : (s.profiles?.display_name ?? null);

    return {
      id: s.id,
      status: s.status,
      created_at: s.created_at,
      payload: s.payload ?? {},
      review_notes: s.review_notes,
      upload_path: s.upload_path,
      submitter_name: resolveSubmitterName(profileName, s.submitter_name, s.submitter_email),
      submitter_email: s.submitter_email,
    };
  });

  return (
    <>
      <AdminTopBar title="Sugerencias" />
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1280, mx: 'auto' }}>
        <SuggestionsClient initialSuggestions={rows} />
      </Box>
    </>
  );
}
