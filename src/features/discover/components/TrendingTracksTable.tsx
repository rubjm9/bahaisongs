'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Box, Stack, Typography } from '@mui/material';
import { PlayButton } from '@/features/player/components/PlayButton';
import { toPlayableList } from '@/features/player/lib/playable';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { trackPath } from '@/shared/lib/seo/paths';
import type { TrendingTrack } from '@/server/data/catalog';

interface Props {
  tracks: readonly TrendingTrack[];
}

/**
 * Ranked play-count table for Discover — denser than TrackSection shelves.
 */
export function TrendingTracksTable({ tracks }: Props) {
  const t = useTranslations('discover');
  const tSections = useTranslations('sections');
  const locale = useLocale() as Locale;

  if (tracks.length === 0) return null;

  const queue = toPlayableList(tracks);

  return (
    <Box component="section" sx={{ width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            color: accent.cyan,
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            mb: 0.5,
          }}
        >
          {tSections('trendingEyebrow')}
        </Typography>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          {tSections('trendingTitle')}
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, fontSize: '0.85rem', mt: 0.5 }}>
          {tSections('trendingDescription')}
        </Typography>
      </Box>

      <Box
        sx={{
          borderRadius: `${radii.md}px`,
          border: `1px solid ${cssVars.borderSubtle}`,
          background: cssVars.bgElevated,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            px: { xs: 1.5, md: 2 },
            py: 1,
            borderBottom: `1px solid ${cssVars.borderSubtle}`,
          }}
        >
          <Typography
            component="span"
            sx={{
              width: 28,
              flexShrink: 0,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: cssVars.textMuted,
              textAlign: 'right',
            }}
          >
            #
          </Typography>
          <Typography
            component="span"
            sx={{
              flex: 1,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: cssVars.textMuted,
            }}
          >
            {t('trendingColTrack')}
          </Typography>
          <Typography
            component="span"
            sx={{
              width: { xs: 56, md: 88 },
              flexShrink: 0,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: cssVars.textMuted,
              textAlign: 'right',
            }}
          >
            {t('trendingColPlays')}
          </Typography>
          <Box sx={{ width: 36, flexShrink: 0 }} aria-hidden />
        </Stack>

        <Stack component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {tracks.map((track, idx) => {
            const playable = queue[idx]!;
            return (
              <Box
                key={track.slug}
                component="li"
                sx={{
                  borderBottom:
                    idx < tracks.length - 1 ? `1px solid ${cssVars.borderSubtle}` : 'none',
                  '&:hover .bs-trending-play': { opacity: 1 },
                  '&:hover': { background: cssVars.hoverSubtle },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: 'center',
                    px: { xs: 1.5, md: 2 },
                    py: 1.25,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      width: 28,
                      flexShrink: 0,
                      color: cssVars.textMuted,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {idx + 1}
                  </Typography>

                  <Box
                    component={Link}
                    href={trackPath(track.slug)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: cssVars.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                      }}
                    >
                      {track.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: cssVars.textMuted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mt: 0.15,
                      }}
                    >
                      {track.artist}
                    </Typography>
                  </Box>

                  <Typography
                    component="span"
                    aria-label={t('trendingPlays', { count: track.playCount })}
                    sx={{
                      width: { xs: 56, md: 88 },
                      flexShrink: 0,
                      color: cssVars.textPrimary,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {track.playCount.toLocaleString(locale)}
                  </Typography>

                  <Box
                    className="bs-trending-play"
                    sx={{
                      width: 36,
                      flexShrink: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      opacity: { xs: 1, md: 0.55 },
                      transition: 'opacity 160ms',
                    }}
                  >
                    <PlayButton
                      track={playable}
                      queue={queue}
                      queueIndex={idx}
                      size={32}
                      variant="ghost"
                    />
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
