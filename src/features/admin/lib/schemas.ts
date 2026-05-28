import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categorySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(slugRegex, 'Solo letras minúsculas, números y guiones'),
  name_es: z.string().min(1).max(100),
  name_en: z.string().min(1).max(100),
  kind: z.enum(['genre', 'mood', 'theme', 'tag']),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const artistSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(slugRegex, 'Solo letras minúsculas, números y guiones'),
  name: z.string().min(1).max(200),
  bio: z.string().max(2000).nullish(),
  country: z.string().max(100).nullish(),
});
export type ArtistFormValues = z.infer<typeof artistSchema>;

export const trackMetaSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(slugRegex, 'Solo letras minúsculas, números y guiones'),
  language: z.string().length(2),
  published_at: z.string().nullish(),
  primary_artist_id: z.string().uuid().nullish(),
  album_id: z.string().uuid().nullish(),
  duration_seconds: z.number().int().positive().nullish(),
});
export type TrackMetaFormValues = z.infer<typeof trackMetaSchema>;

export const lyricsSchema = z.object({
  locale: z.string().min(2).max(5),
  body_plain: z.string().max(20000).nullish(),
  body_chordpro: z.string().max(20000).nullish(),
  has_chords: z.boolean(),
});
export type LyricsFormValues = z.infer<typeof lyricsSchema>;

export const playlistSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(slugRegex, 'Solo letras minúsculas, números y guiones'),
  description: z.string().max(1000).nullish(),
  visibility: z.enum(['public', 'private', 'unlisted']),
});
export type PlaylistFormValues = z.infer<typeof playlistSchema>;
