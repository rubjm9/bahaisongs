import Link from 'next/link';
import { Box, Stack, Chip } from '@mui/material';
import { Music, BookOpen } from 'lucide-react';
import { TrackPlaceholder } from './TrackPlaceholder';
import { PlayButton } from '@/features/player/components/PlayButton';
import { TrackAddToPlaylistSlot } from '@/features/playlists/components/TrackAddToPlaylistSlot';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { trackPath } from '@/shared/lib/seo/paths';
import type { PlayableTrack } from '@/features/player/lib/types';

interface Props {
  track: PlayableTrack & {
    snippet?: string;
    hasChords?: boolean;
    hasAudio?: boolean;
  };
  locale: Locale;
  /** Optional queue context — when present, click on play uses it. */
  queue?: readonly PlayableTrack[];
  queueIndex?: number;
  /** Optional 1-based position label on the left. */
  position?: number;
}

/**
 * Horizontal list row. Outer wrapper is a Link → song page; the PlayButton is
 * the only client island and stops propagation so a click on it doesn't
 * navigate.
 */
export function TrackRow({ track, locale: _locale, queue, queueIndex, position }: Props) {
  const href = trackPath(track.slug);
  return (
    <Box sx={{ position: 'relative' }}>
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            paddingX: 1.25,
            paddingY: 1,
            borderRadius: `${radii.md}px`,
            border: '1px solid transparent',
            transition: 'background-color 160ms, border-color 160ms',
            '&:hover': {
              background: cssVars.hoverSubtle,
              borderColor: cssVars.borderSubtle,
            },
            '&:hover .bs-row-play': { opacity: 1 },
            '&:hover .bs-row-add-playlist': { opacity: 1 },
          }}
        >
          {position !== undefined ? (
            <Box
              sx={{
                width: 28,
                flexShrink: 0,
                color: cssVars.textMuted,
                fontSize: '0.85rem',
                fontWeight: 500,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {position}
            </Box>
          ) : null}

          <TrackPlaceholder title={track.title} size={40} />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                color: cssVars.textPrimary,
                fontWeight: 600,
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {track.title}
            </Box>
            <Box
              sx={{
                color: cssVars.textMuted,
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {track.snippet ?? track.artist}
            </Box>
          </Box>

          <Box
            className="bs-row-play"
            sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity 160ms' }}
          >
            <PlayButton
              track={track}
              {...(queue ? { queue } : {})}
              {...(typeof queueIndex === 'number' ? { queueIndex } : {})}
              size={32}
              variant="ghost"
            />
          </Box>

          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
            <Chip
              size="small"
              label={track.language.toUpperCase()}
              sx={{
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 600,
                background: cssVars.hoverSubtle,
                color: cssVars.textMuted,
                border: `1px solid ${cssVars.borderSubtle}`,
              }}
            />
            {track.hasAudio ? (
              <Box
                aria-hidden
                title="Audio disponible"
                sx={{ display: 'inline-flex', color: accent.cyan }}
              >
                <Music size={14} />
              </Box>
            ) : null}
            {track.hasChords ? (
              <Box
                aria-hidden
                title="Acordes disponibles"
                sx={{ display: 'inline-flex', color: accent.glow }}
              >
                <BookOpen size={14} />
              </Box>
            ) : null}
            <TrackAddToPlaylistSlot
              trackSlug={track.slug}
              className="bs-row-add-playlist"
              sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity 160ms' }}
            />
          </Stack>
        </Stack>
      </Link>
    </Box>
  );
}
