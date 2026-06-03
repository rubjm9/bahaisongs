/** ISO-style codes stored on `tracks.language` in Postgres / the catalogue. */
export const TRACK_LANGUAGES = ['es', 'en', 'pt', 'hu'] as const;
export type TrackLanguage = (typeof TRACK_LANGUAGES)[number];

export const trackLanguageLabels: Record<TrackLanguage, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  hu: 'Húngaro',
};

export function isTrackLanguage(value: string): value is TrackLanguage {
  return (TRACK_LANGUAGES as readonly string[]).includes(value);
}
