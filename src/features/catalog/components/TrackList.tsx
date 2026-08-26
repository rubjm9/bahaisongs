import { Stack } from '@mui/material';
import { TrackRow } from './TrackRow';
import { toPlayableList } from '@/features/player/lib/playable';
import type { Locale } from '@/shared/lib/i18n/config';
import type { CatalogTrack } from '@/server/data/catalog';

interface Props {
  tracks: readonly CatalogTrack[];
  locale: Locale;
  /** When true, prefix rows with their 1-based position. */
  numbered?: boolean;
  /** Analytics source passed to PlayButton. */
  playSource?: string;
}

/**
 * Long vertical list used on /library, /artist/[slug] and /category/[slug].
 * The whole list becomes the player queue context — clicking play on row N
 * starts playback at index N.
 */
export function TrackList({ tracks, locale, numbered = false, playSource = 'discover' }: Props) {
  const queue = toPlayableList(tracks);

  return (
    <Stack spacing={0.25}>
      {tracks.map((t, idx) => (
        <TrackRow
          key={t.slug}
          track={{
            ...queue[idx]!,
            snippet: t.snippet,
            hasAudio: t.hasAudio,
            hasChords: t.hasChords,
          }}
          locale={locale}
          queue={queue}
          queueIndex={idx}
          playSource={playSource}
          {...(numbered ? { position: idx + 1 } : {})}
        />
      ))}
    </Stack>
  );
}
