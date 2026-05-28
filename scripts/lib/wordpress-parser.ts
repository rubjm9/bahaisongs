import { readFile } from 'node:fs/promises';
import { parseStringPromise } from 'xml2js';
import { htmlToText } from './html-to-text';
import { detectChords } from './chord-detection';
import { aggregateCategories } from './category-mapping';

/**
 * Normalised, schema-shaped record produced for each <item> in the WP export.
 */
export interface ParsedTrack {
  /** WP post_id, kept for traceability. */
  legacyId: string;
  /** Resolved slug — falls back to `wp:post_name` then a kebab of the title. */
  slug: string;
  title: string;
  lyricsHtml: string;
  lyricsPlain: string;
  hasChords: boolean;
  language: 'es' | 'en' | 'pt';
  publishedAt: string | null;
  status: 'publish' | 'pending' | 'draft' | 'other';
  excerpt: string | undefined;
  /** Legacy MP3 URL when present. */
  enclosureUrl: string | undefined;
  wpCategorySlugs: string[];
  wpTagSlugs: string[];
  /** Mapped to BahaiSongs categories. */
  categorySlugs: string[];
}

interface XmlItem {
  title?: string[];
  'wp:post_id'?: string[];
  'wp:post_name'?: string[];
  'wp:post_type'?: string[];
  'wp:status'?: string[];
  'wp:post_date_gmt'?: string[];
  'content:encoded'?: string[];
  'excerpt:encoded'?: string[];
  category?: ({ _: string; $: { domain: string; nicename: string } } | string)[];
  'wp:postmeta'?: { 'wp:meta_key': string[]; 'wp:meta_value': string[] }[];
}

function asString(v: string[] | undefined): string {
  return v?.[0] ?? '';
}

function asNullableString(v: string[] | undefined): string | null {
  const s = v?.[0];
  return s && s.length > 0 ? s : null;
}

function kebabCase(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extractTaxonomy(item: XmlItem, domain: 'category' | 'post_tag'): string[] {
  if (!item.category) return [];
  const out: string[] = [];
  for (const cat of item.category) {
    if (typeof cat === 'string') continue;
    if (cat.$.domain === domain) out.push(cat.$.nicename);
  }
  return out;
}

function extractEnclosure(item: XmlItem): string | undefined {
  const postmeta = item['wp:postmeta'];
  if (!postmeta) return undefined;
  for (const meta of postmeta) {
    if (meta['wp:meta_key']?.[0] === 'enclosure') {
      const raw = meta['wp:meta_value']?.[0] ?? '';
      const firstLine = raw.split('\n')[0]?.trim();
      if (firstLine?.endsWith('.mp3') || firstLine?.startsWith('http')) {
        return firstLine;
      }
    }
  }
  return undefined;
}

function normaliseStatus(raw: string): ParsedTrack['status'] {
  if (raw === 'publish') return 'publish';
  if (raw === 'pending') return 'pending';
  if (raw === 'draft') return 'draft';
  return 'other';
}

/**
 * Parse a WordPress WXR (eXtended RSS) XML file and produce one ParsedTrack
 * per published or pending post. Attachments and non-post items are skipped.
 */
export async function parseWordpressExport(filePath: string): Promise<ParsedTrack[]> {
  const raw = await readFile(filePath, 'utf8');
  const parsed = (await parseStringPromise(raw, {
    explicitArray: true,
    trim: false,
    explicitCharkey: false,
  })) as { rss: { channel: { item?: XmlItem[] }[] } };

  const channel = parsed.rss.channel[0];
  if (!channel) return [];
  const items = channel.item ?? [];

  const results: ParsedTrack[] = [];
  for (const item of items) {
    const postType = asString(item['wp:post_type']);
    if (postType !== 'post') continue;

    const status = normaliseStatus(asString(item['wp:status']));
    if (status !== 'publish' && status !== 'pending') continue;

    const title = asString(item.title).trim();
    if (!title) continue;

    const legacyId = asString(item['wp:post_id']);
    const wpSlug = asString(item['wp:post_name']);
    const slug = wpSlug || kebabCase(title);

    const lyricsHtml = asString(item['content:encoded']);
    const lyricsPlain = htmlToText(lyricsHtml);

    const wpCategorySlugs = extractTaxonomy(item, 'category');
    const wpTagSlugs = extractTaxonomy(item, 'post_tag');
    const { categorySlugs, language: inferredLanguage } = aggregateCategories([
      ...wpCategorySlugs,
      ...wpTagSlugs,
    ]);

    // Authoritative chord signal: the WP `con-acordes` tag. Fall back to the
    // prose heuristic for posts where the tag is missing but the lyric body
    // opens with a parenthesised chord list.
    const taggedAsChorded = categorySlugs.includes('con-acordes');
    const heuristicallyChorded = detectChords(lyricsPlain);
    const hasChords = taggedAsChorded || heuristicallyChorded;
    const finalCategories =
      hasChords && !taggedAsChorded ? [...categorySlugs, 'con-acordes'] : categorySlugs;

    results.push({
      legacyId,
      slug,
      title,
      lyricsHtml,
      lyricsPlain,
      hasChords,
      language: inferredLanguage ?? 'es',
      publishedAt: asNullableString(item['wp:post_date_gmt']),
      status,
      excerpt: htmlToText(asString(item['excerpt:encoded'])) || undefined,
      enclosureUrl: extractEnclosure(item),
      wpCategorySlugs,
      wpTagSlugs,
      categorySlugs: finalCategories,
    });
  }

  return results;
}
