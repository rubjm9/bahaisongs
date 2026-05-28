'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Box, Stack, Chip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { GradientText } from '@/shared/ui/GradientText';
import { SearchBox } from './SearchBox';
import { SearchResultItem } from './SearchResultItem';
import { useSearch } from '@/features/catalog/hooks/useSearch';
import type { SearchFilters } from '@/features/catalog/lib/search-engine';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';

const PAGE_LIMIT = 60;

export function SearchPageClient() {
  const t = useTranslations('search');
  const tFilters = useTranslations('search.filters');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const params = useSearchParams();

  const initialQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [language, setLanguage] = useState<'all' | 'es' | 'en'>('all');
  const [withChords, setWithChords] = useState(false);
  const [withAudio, setWithAudio] = useState(false);

  // Mirror the query into the URL so results are shareable.
  useEffect(() => {
    const trimmed = query.trim();
    const next = new URLSearchParams(params.toString());
    if (trimmed.length > 0) next.set('q', trimmed);
    else next.delete('q');
    const url = `${appPath(locale, 'search')}${next.size > 0 ? `?${next.toString()}` : ''}`;
    router.replace(url, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, locale]);

  const filters = useMemo<SearchFilters>(
    () => ({
      language,
      ...(withChords ? { hasChords: true } : {}),
      ...(withAudio ? { hasAudio: true } : {}),
    }),
    [language, withChords, withAudio],
  );

  const { results, loading, totalEntries } = useSearch(query, {
    limit: PAGE_LIMIT,
    filters,
  });

  return (
    <Stack
      spacing={4}
      sx={{ maxWidth: 880, mx: 'auto', paddingY: { xs: 2, md: 4 } }}
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
          {t('totalCatalog', { count: totalEntries })}
        </Typography>
      </Box>

      <SearchBox value={query} onChange={setQuery} placeholder={t('placeholder')} autoFocus />

      {/* Filters */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <FilterChip
          label={tFilters('all')}
          active={language === 'all'}
          onClick={() => setLanguage('all')}
        />
        <FilterChip
          label={tFilters('es')}
          active={language === 'es'}
          onClick={() => setLanguage('es')}
        />
        <FilterChip
          label={tFilters('en')}
          active={language === 'en'}
          onClick={() => setLanguage('en')}
        />
        <Box sx={{ width: 1, height: 18, background: cssVars.borderSubtle, mx: 1 }} aria-hidden />
        <FilterChip
          label={tFilters('withChords')}
          active={withChords}
          onClick={() => setWithChords((v) => !v)}
        />
        <FilterChip
          label={tFilters('withAudio')}
          active={withAudio}
          onClick={() => setWithAudio((v) => !v)}
        />
      </Stack>

      {/* Results header */}
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

      {/* Results list */}
      <Stack spacing={0.5} role="listbox" aria-label={t('title')}>
        {results.map((r) => (
          <SearchResultItem key={r.entry.slug} result={r} locale={locale} />
        ))}
      </Stack>
    </Stack>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Chip
      label={label}
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
  );
}
