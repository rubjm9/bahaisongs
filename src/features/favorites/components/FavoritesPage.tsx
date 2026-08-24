'use client';

import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { accent, cssVars } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath, trackPath } from '@/shared/lib/seo/paths';
import { useLikes } from '../hooks/useLikes';

interface LikedTrack {
  id?: string;
  slug: string;
  title: string;
  artist?: string;
}

interface Props {
  allTracks?: LikedTrack[];
}

export function FavoritesPage({ allTracks = [] }: Props) {
  const t = useTranslations('playlist');
  const locale = useLocale() as Locale;
  const { likedIds, loading: likesLoading } = useLikes();

  if (likesLoading) {
    return (
      <Stack spacing={0.5}>
        {[0, 1, 2, 3].map((i) => (
          <Stack key={i} direction="row" spacing={2} sx={{ alignItems: 'center', px: 2, py: 1.5 }}>
            <Skeleton
              variant="rounded"
              width={40}
              height={40}
              sx={{ flexShrink: 0, borderRadius: '8px' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Skeleton variant="text" width="55%" height={18} />
              <Skeleton variant="text" width="35%" height={14} sx={{ mt: 0.25 }} />
            </Box>
          </Stack>
        ))}
      </Stack>
    );
  }

  const likedTracks =
    allTracks.length > 0
      ? allTracks.filter(
          (tr) => likedIds.has(tr.slug) || (tr.id !== undefined && likedIds.has(tr.id)),
        )
      : [];

  if (likedIds.size === 0 || likedTracks.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          py: 8,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: `radial-gradient(circle, ${accent.glow}22 0%, ${accent.indigo}11 100%)`,
            border: `1px solid ${accent.glow}33`,
            mb: 1,
          }}
        >
          <Heart size={32} strokeWidth={1.5} style={{ color: accent.glow }} />
        </Box>
        <Box>
          <Typography
            sx={{ fontWeight: 600, fontSize: '1.1rem', color: cssVars.textPrimary, mb: 0.5 }}
          >
            {t('emptyFavorites')}
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: cssVars.textMuted, maxWidth: 320 }}>
            Explora el catálogo y pulsa ♡ en cualquier canción para guardarla aquí.
          </Typography>
        </Box>
        <Link href={appPath(locale, 'discover')} style={{ textDecoration: 'none' }}>
          <Box
            sx={{
              mt: 1,
              px: 3,
              py: 1.25,
              borderRadius: '999px',
              background: `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 100%)`,
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'transform 160ms, box-shadow 160ms',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 24px ${accent.cyan}44`,
              },
            }}
          >
            Explorar catálogo
          </Box>
        </Link>
      </Box>
    );
  }

  return (
    <Box>
      {likedTracks.map((track) => (
        <Box
          key={track.slug}
          component={Link}
          href={trackPath(track.slug)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1.5,
            borderRadius: '8px',
            color: cssVars.textPrimary,
            textDecoration: 'none',
            '&:hover': { background: cssVars.hoverSubtle },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                fontWeight: 600,
                fontSize: '0.9rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {track.title}
            </Box>
            {track.artist ? (
              <Box sx={{ fontSize: '0.78rem', color: cssVars.textMuted }}>{track.artist}</Box>
            ) : null}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
