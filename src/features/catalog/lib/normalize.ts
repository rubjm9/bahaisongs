/**
 * Normalise a string for diacritic- and punctuation-insensitive search.
 *
 *   normalize("¡Oh Dios! Guíame")   → "oh dios guiame"
 *   normalize("Bahá'u'lláh")        → "bahaullah"
 *   normalize("Sí — Lá")            → "si la"
 *
 * Used both to build the `searchKey` field at index time AND to normalise the
 * user's query at search time, so an "unaccented" Spanish keyboard input still
 * matches the canonical entry.
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .replace(/['‘’`´ʹʻʼ]/g, '') // strip apostrophes / typographic quotes (U+2018, U+2019, …)
    .toLowerCase();
}
