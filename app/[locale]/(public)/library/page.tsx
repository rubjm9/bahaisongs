import { Stack, Typography, Box } from '@mui/material';
import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { GradientText } from '@/shared/ui/GradientText';
import { categoryLabel } from '@/features/catalog/lib/category-labels';
import { getAllTracks, getActiveCategorySlugs } from '@/server/data/catalog';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import { LibraryTabs } from '@/features/library/components/LibraryTabs';

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ language?: string }>;

const FEATURED_CATEGORIES = ['oracion', 'tranquila', 'muy-ritmica', 'texto-sagrado', 'con-acordes'];

function parseLanguageFilter(value: string | undefined): 'es' | 'en' | 'pt' | null {
  if (value === 'es' || value === 'en' || value === 'pt') return value;
  return null;
}

export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { language: languageParam } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('library');
  const languageFilter = parseLanguageFilter(languageParam);
  const [allTracksData, activeCategorySlugs] = await Promise.all([
    getAllTracks(),
    getActiveCategorySlugs(),
  ]);
  const tracks = languageFilter
    ? allTracksData.filter((track) => track.language === languageFilter)
    : allTracksData;
  const loc = locale as Locale;
  const activeSlugs = new Set(activeCategorySlugs);

  return (
    <Stack spacing={5} sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Box>
        <Typography
          sx={{
            color: accent.cyan,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          {t('eyebrow')}
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700 }}>
          <GradientText variant="aurora">{t('title')}</GradientText>
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, mt: 1, fontSize: '0.95rem' }}>
          {t('totalCount', { count: tracks.length })}
        </Typography>
      </Box>

      {/* Category shortcuts */}
      <Box>
        <Typography
          sx={{
            color: cssVars.textMuted,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            mb: 1.5,
          }}
        >
          {t('browseByCategory')}
        </Typography>
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {FEATURED_CATEGORIES.filter((s) => activeSlugs.has(s)).map((slug) => (
            <Link
              key={slug}
              href={appPath(loc, `category/${slug}`)}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  paddingX: 2,
                  paddingY: 1,
                  borderRadius: `${radii.pill}px`,
                  background: cssVars.bgGlass,
                  border: `1px solid ${cssVars.borderSubtle}`,
                  color: cssVars.textPrimary,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'border-color 160ms, color 160ms',
                  '&:hover': {
                    borderColor: cssVars.borderStrong,
                    color: accent.cyan,
                  },
                }}
              >
                {categoryLabel(slug, loc)}
              </Box>
            </Link>
          ))}
        </Stack>
      </Box>

      {/* Tabs: All / Favorites / Playlists */}
      <LibraryTabs tracks={tracks} locale={loc} />
    </Stack>
  );
}
