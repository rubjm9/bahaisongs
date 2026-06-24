'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Box, Divider, Stack, Chip, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { ListMusic } from 'lucide-react';
import { GradientText } from '@/shared/ui/GradientText';
import { SearchBox } from '@/features/catalog/components/SearchBox';
import { SearchResultItem } from '@/features/catalog/components/SearchResultItem';
import { TrackList } from '@/features/catalog/components/TrackList';
import { useSearch } from '@/features/catalog/hooks/useSearch';
import type { SearchFilters } from '@/features/catalog/lib/search-engine';
import { categoryLabel } from '@/features/catalog/lib/category-labels';
import {
  isTrackLanguage,
  trackLanguageLabels,
  type TrackLanguage,
} from '@/features/catalog/lib/track-languages';
import { FEATURED_CATEGORIES } from '@/features/discover/lib/featured-categories';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import type { CatalogLanguageOption, CatalogTrack } from '@/server/data/catalog';

const PAGE_LIMIT = 60;

interface Props {
  catalogLanguages: CatalogLanguageOption[];
  featuredCategorySlugs: string[];
  allTracks: readonly CatalogTrack[];
}

export function DiscoverPageClient({
  catalogLanguages,
  featuredCategorySlugs,
  allTracks,
}: Props) {
  const t = useTranslations('discover');
  const tPublicPlaylists = useTranslations('publicPlaylists');
  const tFilters = useTranslations('search.filters');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const params = useSearchParams();

  const initialQuery = params.get('q') ?? '';
  const initialLanguageParam = params.get('language');
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState<'all' | TrackLanguage>(() => {
    if (initialLanguageParam && isTrackLanguage(initialLanguageParam)) {
      return initialLanguageParam;
    }
    return 'all';
  });
  const [withChords, setWithChords] = useState(false);
  const [withAudio, setWithAudio] = useState(false);

  const hasActiveQuery = query.trim().length > 0;

  useEffect(() => {
    const trimmed = query.trim();
    const next = new URLSearchParams(params.toString());
    if (trimmed.length > 0) next.set('q', trimmed);
    else next.delete('q');
    if (language === 'all') next.delete('language');
    else next.set('language', language);
    const url = `${appPath(locale, 'discover')}${next.size > 0 ? `?${next.toString()}` : ''}`;
    router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, language, locale]);

  const filters = useMemo<SearchFilters>(
    () => ({
      language,
      ...(withChords ? { hasChords: true } : {}),
      ...(withAudio ? { hasAudio: true } : {}),
    }),
    [language, withChords, withAudio],
  );

  const { results, loading } = useSearch(query, {
    limit: PAGE_LIMIT,
    filters,
  });

  const catalogCount = allTracks.length;

  const browseTracks = useMemo(() => {
    let list = [...allTracks];
    if (language !== 'all') {
      list = list.filter((tr) => tr.language === language);
    }
    if (withChords) list = list.filter((tr) => tr.hasChords);
    if (withAudio) list = list.filter((tr) => tr.hasAudio);
    return list;
  }, [allTracks, language, withChords, withAudio]);

  const activeFeatured = FEATURED_CATEGORIES.filter((slug) =>
    featuredCategorySlugs.includes(slug),
  );

  return (
    <Stack
      spacing={4}
      sx={{ maxWidth: 1100, mx: 'auto', paddingY: { xs: 2, md: 4 } }}
      component={motion.section}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
    >
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '2.5rem' } }}>
          <GradientText variant="aurora">{t('title')}</GradientText>
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, mt: 1, fontSize: '0.95rem' }}>
          {t('subtitle')}
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, mt: 0.5, fontSize: '0.85rem' }}>
          {t('totalCatalog', { count: catalogCount })}
        </Typography>
      </Box>

      <SearchBox value={query} onChange={setQuery} placeholder={t('placeholder')} autoFocus />

      <Stack
        direction="row"
        spacing={1}
        role="group"
        aria-label={tFilters('language')}
        sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
      >
        <FilterChip
          label={tFilters('all')}
          tooltip={tFilters('tooltips.all')}
          active={language === 'all'}
          onClick={() => setLanguage('all')}
        />
        {catalogLanguages.map(({ code, count }) => (
          <FilterChip
            key={code}
            label={trackLanguageLabels[code]}
            tooltip={tFilters('tooltips.language', { language: trackLanguageLabels[code] })}
            count={count}
            active={language === code}
            onClick={() => setLanguage(code)}
          />
        ))}
        <Divider
          orientation="vertical"
          flexItem
          aria-hidden
          sx={{ mx: 0.5, borderColor: cssVars.borderSubtle, alignSelf: 'stretch' }}
        />
        <FilterChip
          label={tFilters('withChords')}
          tooltip={tFilters('tooltips.withChords')}
          active={withChords}
          onClick={() => setWithChords((v) => !v)}
        />
        <FilterChip
          label={tFilters('withAudio')}
          tooltip={tFilters('tooltips.withAudio')}
          active={withAudio}
          onClick={() => setWithAudio((v) => !v)}
        />
      </Stack>

      {!hasActiveQuery ? (
        <Link href={appPath(locale, 'public-playlists')} style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: `${radii.md}px`,
              background: cssVars.bgGlass,
              border: `1px solid ${cssVars.borderSubtle}`,
              transition: 'border-color 160ms',
              '&:hover': { borderColor: cssVars.borderStrong },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: `${radii.sm}px`,
                background: `${accent.cyan}14`,
                color: accent.cyan,
                flexShrink: 0,
              }}
            >
              <ListMusic size={18} aria-hidden />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: cssVars.textPrimary }}>
                {tPublicPlaylists('discoverCta')}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: cssVars.textMuted, mt: 0.25 }}>
                {tPublicPlaylists('discoverCtaHint')}
              </Typography>
            </Box>
          </Box>
        </Link>
      ) : null}

      {!hasActiveQuery && activeFeatured.length > 0 ? (
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
            {activeFeatured.map((slug) => (
              <Link
                key={slug}
                href={appPath(locale, `category/${slug}`)}
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
                  {categoryLabel(slug, locale)}
                </Box>
              </Link>
            ))}
          </Stack>
        </Box>
      ) : null}

      {hasActiveQuery ? (
        <>
          <Box>
            <Typography
              sx={{
                color: cssVars.textMuted,
                fontSize: '0.78rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {loading ? t('loading') : t('resultsCount', { count: results.length })}
            </Typography>
          </Box>
          <Stack spacing={0.5} role="listbox" aria-label={t('title')}>
            {results.map((r) => (
              <SearchResultItem key={r.entry.slug} result={r} locale={locale} />
            ))}
          </Stack>
        </>
      ) : (
        <Box>
          <Typography
            sx={{
              color: cssVars.textMuted,
              fontSize: '0.78rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              fontWeight: 600,
              mb: 2,
            }}
          >
            {t('allTracksHeading', { count: browseTracks.length })}
          </Typography>
          <TrackList tracks={browseTracks} locale={locale} numbered />
        </Box>
      )}
    </Stack>
  );
}

function FilterChip({
  label,
  tooltip,
  count,
  active,
  onClick,
}: {
  label: string;
  tooltip: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  const chipLabel = count !== undefined ? `${label} (${count})` : label;
  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Chip
        label={chipLabel}
        onClick={onClick}
        sx={{
          background: active ? 'rgba(79,209,255,0.14)' : cssVars.bgGlass,
          color: active ? accent.cyan : cssVars.textMuted,
          border: `1px solid ${active ? cssVars.borderStrong : cssVars.borderSubtle}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          fontWeight: 500,
          borderRadius: `${radii.pill}px`,
          transition: 'all 160ms',
          '&:hover': {
            background: 'rgba(79,209,255,0.10)',
            color: cssVars.textPrimary,
          },
        }}
      />
    </Tooltip>
  );
}
