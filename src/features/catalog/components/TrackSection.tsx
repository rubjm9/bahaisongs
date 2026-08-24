import Link from 'next/link';
import { Box, Stack, Typography } from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { TrackCard } from './TrackCard';
import { toPlayableList } from '@/features/player/lib/playable';
import { accent, cssVars } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import type { CatalogTrack } from '@/server/data/catalog';

interface Props {
  title: string;
  eyebrow?: string;
  description?: string;
  tracks: readonly CatalogTrack[];
  locale: Locale;
  seeAllHref?: string;
  seeAllLabel?: string;
}

/**
 * Horizontal track shelf. Projects the CatalogTrack list down to a
 * PlayableTrack queue once on the server, then renders cards. Clicking a
 * card's Play button starts that shelf as the active queue.
 */
export function TrackSection({
  title,
  eyebrow,
  description,
  tracks,
  locale,
  seeAllHref,
  seeAllLabel,
}: Props) {
  if (tracks.length === 0) return null;
  const queue = toPlayableList(tracks);

  return (
    <Box component="section" sx={{ width: '100%' }}>
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 2 }}
      >
        <Box>
          {eyebrow ? (
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
              {eyebrow}
            </Typography>
          ) : null}
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, fontSize: { xs: '1.4rem', md: '1.75rem' } }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography sx={{ color: cssVars.textMuted, fontSize: '0.85rem', mt: 0.5 }}>
              {description}
            </Typography>
          ) : null}
        </Box>

        {seeAllHref && seeAllLabel ? (
          <Link href={seeAllHref} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: 'center',
                color: cssVars.textMuted,
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'color 160ms',
                '&:hover': { color: cssVars.textPrimary },
              }}
            >
              <span>{seeAllLabel}</span>
              <ArrowRight size={14} />
            </Stack>
          </Link>
        ) : null}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateRows: 'repeat(2, auto)',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(240px, 280px)',
          gap: 2,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          // Room for card hover lift + box-shadow; overflow-x otherwise clips them.
          mx: -2,
          px: 2,
          mt: -1,
          pt: 1,
          mb: -2.5,
          pb: 3,
          '& > *': {
            scrollSnapAlign: 'start',
          },
        }}
      >
        {tracks.map((t, idx) => (
          <TrackCard
            key={t.slug}
            track={{
              ...queue[idx]!,
              hasAudio: t.hasAudio,
              hasChords: t.hasChords,
            }}
            locale={locale}
            queue={queue}
            queueIndex={idx}
          />
        ))}
      </Box>
    </Box>
  );
}
