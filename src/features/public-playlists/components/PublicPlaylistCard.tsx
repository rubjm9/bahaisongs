'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { ListMusic } from 'lucide-react';
import type { PublicPlaylistSummary } from '@/server/data/playlists';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { accent, cssVars, radii } from '@/shared/theme/tokens';

interface Props {
  playlist: PublicPlaylistSummary;
}

export function PublicPlaylistCard({ playlist }: Props) {
  const t = useTranslations('publicPlaylists');
  const locale = useLocale() as Locale;
  const href = appPath(locale, `playlist/${playlist.slug}`);

  const badgeLabel = playlist.isCurated
    ? t('curatedBadge')
    : playlist.ownerDisplayName
      ? t('byUser', { name: playlist.ownerDisplayName })
      : t('byUserAnonymous');

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          p: 2.5,
          height: '100%',
          borderRadius: `${radii.md}px`,
          background: cssVars.bgGlass,
          border: `1px solid ${cssVars.borderSubtle}`,
          transition: 'border-color 160ms, transform 160ms',
          '&:hover': {
            borderColor: cssVars.borderStrong,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
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
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.95rem',
                color: cssVars.textPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {playlist.title}
            </Typography>
            {playlist.description ? (
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: '0.8rem',
                  color: cssVars.textMuted,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {playlist.description}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 'auto' }}>
          <Chip
            label={t('trackCount', { count: playlist.trackCount })}
            size="small"
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
          <Chip
            label={badgeLabel}
            size="small"
            sx={{
              fontSize: '0.7rem',
              height: 22,
              fontWeight: 600,
              background: playlist.isCurated ? `${accent.cyan}18` : `${accent.electric}14`,
              color: playlist.isCurated ? accent.cyan : accent.electric,
            }}
          />
        </Stack>
      </Box>
    </Link>
  );
}
