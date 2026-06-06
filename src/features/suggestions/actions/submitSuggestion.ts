'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { hasServiceRoleKey, supabaseEnabled } from '@/shared/lib/supabase/env';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/shared/lib/supabase/server';
import {
  anonymousSuggestSchema,
  buildSuggestionPayload,
  suggestFormSchema,
  type SuggestFormValues,
} from '@/features/suggestions/lib/suggestionSchema';

export type SubmitSuggestionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function zodFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function submitSuggestion(input: SuggestFormValues): Promise<SubmitSuggestionResult> {
  if (!supabaseEnabled || !hasServiceRoleKey) {
    return { ok: false, error: 'serviceUnavailable' };
  }

  let submittedBy: string | null = null;
  let submitterName: string | null = input.submitterName?.trim() ?? null;
  let submitterEmail: string | null = input.submitterEmail?.trim() ?? null;

  try {
    const sessionClient = await getSupabaseServerClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();

    if (user) {
      submittedBy = user.id;
      if (!submitterName) {
        const { data: profile } = await sessionClient
          .from('profiles')
          .select('display_name')
          .eq('id' as never, user.id)
          .maybeSingle();
        submitterName = (profile as { display_name: string | null } | null)?.display_name ?? null;
      }
      if (!submitterEmail && user.email) submitterEmail = user.email;
    }
  } catch {
    // Anonymous submission.
  }

  const schema = submittedBy ? suggestFormSchema : anonymousSuggestSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validationFailed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;
  const payload = buildSuggestionPayload(data);
  const uploadPath = data.sourceKind === 'mp3_r2' ? (data.uploadPath ?? null) : null;

  const service = getSupabaseServiceClient();
  const { data: row, error } = await service
    .from('suggestions')
    .insert({
      id: data.suggestionId,
      submitted_by: submittedBy,
      submitter_name: submitterName,
      submitter_email: submitterEmail,
      status: 'pending',
      payload: payload as never,
      upload_path: uploadPath,
    } as never)
    .select('id')
    .single();

  if (error || !row) {
    console.error('[submitSuggestion]', error?.message);
    return { ok: false, error: 'insertFailed' };
  }

  revalidateTag('suggestions');
  revalidatePath('/admin/suggestions');
  revalidatePath('/admin');

  return { ok: true, id: (row as { id: string }).id };
}
