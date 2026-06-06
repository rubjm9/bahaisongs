import { z } from 'zod';
import { TRACK_LANGUAGES } from '@/features/catalog/lib/track-languages';
import { knownCategorySlugs } from '@/features/catalog/lib/category-labels';

const categorySlugSet = new Set(knownCategorySlugs());

const youtubeIdRegex =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function extractYoutubeRef(value: string): string | null {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = youtubeIdRegex.exec(trimmed);
  return match?.[1] ?? null;
}

const baseFields = {
  title: z.string().trim().min(1, 'required').max(300),
  artistName: z.string().trim().max(200).optional(),
  language: z.enum(TRACK_LANGUAGES),
  categorySlugs: z
    .array(z.string())
    .max(8)
    .refine((slugs) => slugs.every((s) => categorySlugSet.has(s)), 'invalidCategory'),
  sourceKind: z.enum(['mp3_r2', 'youtube']),
  youtubeUrl: z.string().trim().optional(),
  lyricsPlain: z.string().trim().max(20000).optional(),
  lyricsChordPro: z.string().trim().max(20000).optional(),
  hasChords: z.boolean(),
  notes: z.string().trim().max(2000).optional(),
  submitterName: z.string().trim().max(120).optional(),
  submitterEmail: z.string().trim().email('invalidEmail').max(254).optional().or(z.literal('')),
  rightsConfirmed: z.literal(true, { errorMap: () => ({ message: 'rightsRequired' }) }),
  uploadPath: z.string().trim().optional(),
  suggestionId: z.string().uuid(),
};

export const suggestFormSchema = z
  .object(baseFields)
  .superRefine((data, ctx) => {
    if (data.sourceKind === 'youtube') {
      if (!data.youtubeUrl) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'youtubeRequired', path: ['youtubeUrl'] });
        return;
      }
      if (!extractYoutubeRef(data.youtubeUrl)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalidYoutube', path: ['youtubeUrl'] });
      }
    }

    if (data.sourceKind === 'mp3_r2') {
      if (!data.uploadPath) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'uploadRequired', path: ['uploadPath'] });
        return;
      }
      const expectedPrefix = `incoming/${data.suggestionId}/`;
      if (!data.uploadPath.startsWith(expectedPrefix)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalidUploadPath', path: ['uploadPath'] });
      }
    }
  });

export type SuggestFormValues = z.infer<typeof suggestFormSchema>;

export const anonymousSuggestSchema = suggestFormSchema.superRefine((data, ctx) => {
  if (!data.submitterName?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'nameRequired', path: ['submitterName'] });
  }
  if (!data.submitterEmail?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'emailRequired', path: ['submitterEmail'] });
  }
});

export function buildSuggestionPayload(data: SuggestFormValues) {
  const sourceRef =
    data.sourceKind === 'youtube'
      ? (extractYoutubeRef(data.youtubeUrl ?? '') ?? '')
      : (data.uploadPath ?? '');

  return {
    title: data.title,
    artistName: data.artistName?.trim() ? data.artistName.trim() : undefined,
    language: data.language,
    categorySlugs: data.categorySlugs,
    hasChords: data.hasChords,
    lyricsPlain: data.lyricsPlain ?? undefined,
    lyricsChordPro: data.lyricsChordPro ?? undefined,
    notes: data.notes ?? undefined,
    source: {
      kind: data.sourceKind,
      ref: sourceRef,
    },
  };
}
