/**
 * Convert WordPress HTML lyric content to plain text.
 *
 * The legacy posts wrap each line in <p>...</p>, sometimes with <br>, <strong>
 * and a handful of entities (&nbsp;, &#8217;, &#039;, etc.). This helper:
 *   1. normalises block boundaries to "\n"
 *   2. strips all tags
 *   3. decodes the entity subset used in the export
 *   4. collapses excessive whitespace while preserving stanza breaks
 */

const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#039;': "'",
  '&#39;': "'",
  '&#8216;': '‘',
  '&#8217;': '’',
  '&#8220;': '“',
  '&#8221;': '”',
  '&#8211;': '–',
  '&#8212;': '—',
  '&hellip;': '…',
  '&#8230;': '…',
};

export function htmlToText(html: string): string {
  if (!html) return '';

  // 1. Block-level tags → newlines
  let out = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n');

  // 2. Strip all remaining tags
  out = out.replace(/<[^>]+>/g, '');

  // 3. Decode known entities
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    out = out.split(entity).join(char);
  }
  // Numeric entities catch-all
  out = out.replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCodePoint(parseInt(n, 16)));

  // 4. Normalise whitespace: collapse 3+ newlines to 2, trim trailing spaces per line
  out = out
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return out;
}
