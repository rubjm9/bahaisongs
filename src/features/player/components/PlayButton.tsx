'use client';

import { useRef, type MouseEvent } from 'react';
import { IconButton } from '@mui/material';
import { Play, Pause, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueueStore, selectCurrentTrack } from '../stores/queueStore';
import { usePlayerStore } from '../stores/playerStore';
import { hasPlayableSource } from '../lib/sourceResolver';
import type { PlayableTrack } from '../lib/types';
import { accent, cssVars } from '@/shared/theme/tokens';
import { mergeSx } from '@/shared/ui/sx';
import type { SxProps, Theme } from '@mui/material/styles';

interface Props {
  track: PlayableTrack;
  /** Optional queue context — when supplied, click plays the list starting at
   *  `queueIndex` instead of an isolated single-track queue. */
  queue?: readonly PlayableTrack[];
  queueIndex?: number;
  /** Analytics source label (discover, search, playlist:slug, player). */
  source?: string;
  size?: number;
  variant?: 'solid' | 'ghost';
  sx?: SxProps<Theme>;
  ariaLabel?: string;
}

export function PlayButton({
  track,
  queue,
  queueIndex,
  source = 'player',
  size = 36,
  variant = 'solid',
  sx,
  ariaLabel,
}: Props) {
  const lastClickRef = useRef(0);
  const tPlayer = useTranslations('player');

  const currentSlug = useQueueStore((s) => selectCurrentTrack(s)?.slug ?? null);
  const status = usePlayerStore((s) => s.status);
  const isCurrent = currentSlug === track.slug;
  const isPlaying = isCurrent && status === 'playing';
  const isLoading = isCurrent && status === 'loading';
  const playable = hasPlayableSource(track);

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!playable) return;
    const now = Date.now();
    if (now - lastClickRef.current < 120) return;
    lastClickRef.current = now;

    const audio = document.getElementById('bs-global-audio') as HTMLAudioElement | null;

    if (isCurrent && audio) {
      if (audio.paused) void audio.play().catch(() => undefined);
      else audio.pause();
      return;
    }

    if (queue && queue.length > 0 && typeof queueIndex === 'number') {
      useQueueStore.getState().playList(queue, queueIndex, source);
    } else {
      useQueueStore.getState().playNow(track, source);
    }
  };

  const baseSx =
    variant === 'solid'
      ? {
          background: playable
            ? `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 100%)`
            : cssVars.bgElevated,
          color: playable ? cssVars.textInverse : cssVars.textMuted,
          width: size,
          height: size,
          boxShadow: playable ? cssVars.shadowGlow : 'none',
          transition: 'transform 160ms, box-shadow 160ms',
          '&:hover': playable
            ? {
                transform: 'scale(1.06)',
                boxShadow: cssVars.shadowGlowStrong,
              }
            : {},
          '&:disabled': { opacity: 0.5 },
        }
      : {
          background: 'transparent',
          color: playable ? cssVars.textPrimary : cssVars.textMuted,
          width: size,
          height: size,
          border: `1px solid ${cssVars.borderSubtle}`,
          '&:hover': playable ? { background: cssVars.navActiveBg } : {},
        };

  const label =
    ariaLabel ??
    (!playable
      ? tPlayer('audioUnavailable', { title: track.title })
      : isPlaying
        ? tPlayer('pauseTrack', { title: track.title })
        : tPlayer('playTrack', { title: track.title }));

  return (
    <IconButton
      aria-label={label}
      aria-pressed={isCurrent}
      disabled={!playable}
      onClick={onClick}
      size="small"
      sx={mergeSx(baseSx, sx)}
    >
      {isLoading ? (
        <Loader2 size={Math.round(size * 0.45)} className="bs-spin" />
      ) : isPlaying ? (
        <Pause size={Math.round(size * 0.45)} fill="currentColor" />
      ) : (
        <Play size={Math.round(size * 0.45)} fill="currentColor" />
      )}
    </IconButton>
  );
}
