'use client';

import { useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Box, IconButton, Stack, Slider } from '@mui/material';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { appPath, trackPath } from '@/shared/lib/seo/paths';
import type { Locale } from '@/shared/lib/i18n/config';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import { GradientText } from '@/shared/ui/GradientText';
import { mergeSx } from '@/shared/ui/sx';
import { MOBILE_NAV_HEIGHT } from '@/shared/ui/shellLayout';
import { LikeButton } from '@/features/favorites/components/LikeButton';
import { usePlayerStore } from '../stores/playerStore';
import { useQueueStore, selectCurrentTrack } from '../stores/queueStore';
import { useAudioElement } from '../hooks/useAudioElement';
import { usePlayerActions } from '../hooks/usePlayerActions';
import { useMediaSession } from '../hooks/useMediaSession';
import { usePlayerHydration } from '../hooks/usePlayerHydration';
import { usePlayAnalytics } from '../hooks/usePlayAnalytics';
import { hasPlayableSource, resolveSource } from '../lib/sourceResolver';
import { playRandomTrack } from '../lib/randomTrack';

const YoutubeFloatingPlayer = dynamic(
  () =>
    import('./YoutubeFloatingPlayer').then((m) => ({ default: m.YoutubeFloatingPlayer })),
  { ssr: false },
);

/**
 * The single, global player bar. Mounts the only `<audio>` element in the
 * application (id="bs-global-audio"). All higher-level UI talks to it via the
 * Zustand stores in this folder.
 */
export function PlayerBar() {
  usePlayerHydration();
  usePlayAnalytics();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const randomLoadingRef = useRef(false);
  useAudioElement(audioRef);
  useMediaSession(audioRef);
  const actions = usePlayerActions(audioRef);
  const locale = useLocale() as Locale;
  const tPlayer = useTranslations('player');
  const [randomLoading, setRandomLoading] = useState(false);

  const current = useQueueStore((s) => selectCurrentTrack(s));
  const status = usePlayerStore((s) => s.status);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const repeat = usePlayerStore((s) => s.repeat);
  const shuffleOn = usePlayerStore((s) => s.shuffle);

  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';
  const hasTrack = current !== null;
  const playable = current ? hasPlayableSource(current) : false;
  const isYoutubeTrack = current ? resolveSource(current).kind === 'youtube' : false;

  const onShuffleToggle = () => {
    const next = !shuffleOn;
    usePlayerStore.getState().toggleShuffle();
    useQueueStore.getState().applyShuffle(next);
  };

  const onPlayRandom = useCallback(async () => {
    if (randomLoadingRef.current) return;
    randomLoadingRef.current = true;
    setRandomLoading(true);
    try {
      await playRandomTrack(actions.playList);
    } finally {
      randomLoadingRef.current = false;
      setRandomLoading(false);
    }
  }, [actions.playList]);

  return (
    <>
      <YoutubeFloatingPlayer />
      <Box
        component="footer"
        aria-label={tPlayer('label')}
        sx={{
          position: 'fixed',
          left: { xs: 8, md: 'calc(var(--bs-sidebar-width, 240px) + 16px)' },
          right: { xs: 8, md: 16 },
          bottom: {
            xs: `calc(${MOBILE_NAV_HEIGHT} + 8px + env(safe-area-inset-bottom, 0px))`,
            md: 16,
          },
          zIndex: 8,
          transition: 'left 240ms cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      >
      <audio
        ref={audioRef}
        id="bs-global-audio"
        preload="metadata"
        // Sin crossOrigin: los MP3 legacy (bahai.es / bahaisongs.org) no envían
        // Access-Control-Allow-Origin; con anonymous el navegador rechaza la carga.
      />
      <Box
        component={motion.div}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
        sx={{
          background: cssVars.bgGlass,
          border: `1px solid ${cssVars.borderSubtle}`,
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          borderRadius: `${radii.lg}px`,
          paddingX: { xs: 1.5, md: 2 },
          paddingY: { xs: 1, md: 1.25 },
          boxShadow: cssVars.shadowCard,
        }}
      >
        {/* Timeline */}
        <Slider
          aria-label={tPlayer('position')}
          value={Math.min(position, duration || position)}
          min={0}
          max={duration > 0 ? duration : 1}
          step={duration > 0 ? duration / 1000 : 0.01}
          disabled={!hasTrack || !playable || duration <= 0}
          onChange={(_, v) => {
            if (typeof v === 'number') actions.seekTo(v);
          }}
          sx={{
            paddingY: 0,
            color: accent.cyan,
            height: 4,
            '& .MuiSlider-thumb': {
              width: 10,
              height: 10,
              transition: 'opacity 160ms',
              opacity: 0,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: '0 0 0 8px rgba(79,209,255,0.16)',
              },
            },
            '&:hover .MuiSlider-thumb, &.Mui-focusVisible .MuiSlider-thumb': { opacity: 1 },
            '& .MuiSlider-rail': { opacity: 0.3 },
          }}
        />

        <Box
          sx={{
            mt: 0.5,
            display: 'grid',
            alignItems: 'center',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr) auto',
              md: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
            },
            columnGap: { xs: 2, md: 1.5 },
          }}
        >
          {/* Izquierda — meta de la pista */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', minWidth: 0, gridColumn: '1', justifySelf: 'start' }}
          >
            <Box
              aria-hidden
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: `${radii.md}px`,
                background: hasTrack
                  ? `linear-gradient(135deg, ${accent.indigo}55 0%, ${accent.cyan}55 100%)`
                  : cssVars.hoverSubtle,
                display: 'grid',
                placeItems: 'center',
                color: cssVars.textPrimary,
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                border: `1px solid ${cssVars.borderStrong}`,
              }}
            >
              {current ? (
                current.title.charAt(0).toUpperCase()
              ) : (
                <Shuffle size={20} strokeWidth={2} aria-hidden />
              )}
            </Box>
            <Stack direction="row" spacing={0.5} sx={{ minWidth: 0, alignItems: 'center' }}>
              {current ? (
                <>
                  <Box sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Link
                        href={trackPath(current.slug)}
                        style={{ textDecoration: 'none' }}
                      >
                        <GradientText variant="aurora">{current.title}</GradientText>
                      </Link>
                    </Box>
                    <Box
                      sx={{
                        color: cssVars.textMuted,
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Link
                        href={appPath(locale, `artist/${current.artistSlug}`)}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {current.artist}
                      </Link>
                      {!playable
                        ? ' · sin audio'
                        : isYoutubeTrack
                          ? duration > 0
                            ? ` · ${formatTime(position)} / ${formatTime(duration)}`
                            : ' · YouTube'
                          : duration > 0
                            ? ` · ${formatTime(position)} / ${formatTime(duration)}`
                            : ''}
                    </Box>
                  </Box>
                  <LikeButton trackId={current.slug} trackSlug={current.slug} />
                </>
              ) : (
                <Box sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      fontWeight: 600,
                      color: cssVars.textPrimary,
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <GradientText variant="aurora">{tPlayer('idleTitle')}</GradientText>
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => void onPlayRandom()}
                    disabled={randomLoading}
                    aria-busy={randomLoading}
                    sx={{
                      display: 'block',
                      width: '100%',
                      maxWidth: 280,
                      mt: 0.25,
                      p: 0,
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: randomLoading ? 'wait' : 'pointer',
                      color: accent.cyan,
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      whiteSpace: { xs: 'normal', sm: 'nowrap' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      '&:hover': randomLoading ? undefined : { textDecoration: 'underline' },
                      '&:disabled': { opacity: 0.65 },
                    }}
                  >
                    {randomLoading ? tPlayer('idleRandomLoading') : tPlayer('idleRandomCta')}
                  </Box>
                </Box>
              )}
            </Stack>
          </Stack>

          {/* Centro — controles (escritorio) */}
          <Stack
            direction="row"
            spacing={0.25}
            sx={{
              alignItems: 'center',
              display: { xs: 'none', md: 'flex' },
              gridColumn: '2',
              justifySelf: 'center',
            }}
          >
            <PlayerControl
              aria-label={tPlayer('shuffle')}
              active={shuffleOn}
              onClick={onShuffleToggle}
              disabled={!hasTrack}
            >
              <Shuffle size={16} />
            </PlayerControl>
            <PlayerControl
              aria-label={tPlayer('previous')}
              onClick={() => actions.prev()}
              disabled={!hasTrack}
            >
              <SkipBack size={18} className="bs-flip-rtl" />
            </PlayerControl>
            <PlayerControl
              aria-label={isPlaying ? tPlayer('pause') : tPlayer('play')}
              onClick={() => actions.togglePlayPause()}
              disabled={!hasTrack || !playable}
              sx={{
                background: `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 100%)`,
                color: cssVars.textInverse,
                width: 40,
                height: 40,
                boxShadow: '0 0 16px rgba(79,209,255,0.32)',
                '&:hover': hasTrack
                  ? { transform: 'scale(1.06)', boxShadow: '0 0 24px rgba(79,209,255,0.48)' }
                  : {},
                '&.Mui-disabled': { color: cssVars.textInverse, opacity: 0.4 },
              }}
            >
              {isLoading ? (
                <Loader2 size={18} className="bs-spin" />
              ) : isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </PlayerControl>
            <PlayerControl
              aria-label={tPlayer('next')}
              onClick={() => actions.next()}
              disabled={!hasTrack}
            >
              <SkipForward size={18} className="bs-flip-rtl" />
            </PlayerControl>
            <PlayerControl
              aria-label={tPlayer('repeat')}
              active={repeat !== 'off'}
              onClick={() => usePlayerStore.getState().cycleRepeat()}
              disabled={!hasTrack}
            >
              {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </PlayerControl>
          </Stack>

          {/* Derecha — volumen (escritorio) */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              display: { xs: 'none', md: 'flex' },
              gridColumn: '3',
              justifySelf: 'end',
              width: '100%',
              maxWidth: 180,
              color: cssVars.textMuted,
            }}
          >
            <IconButton
              size="small"
              aria-label={muted ? tPlayer('unmute') : tPlayer('mute')}
              onClick={() => usePlayerStore.getState().toggleMuted()}
              sx={{ color: cssVars.textMuted, '&:hover': { color: cssVars.textPrimary } }}
            >
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </IconButton>
            <Slider
              value={muted ? 0 : volume * 100}
              min={0}
              max={100}
              onChange={(_, v) => {
                if (typeof v === 'number') {
                  usePlayerStore.getState().setVolume(v / 100);
                  if (v > 0 && muted) usePlayerStore.getState().toggleMuted();
                }
              }}
              size="small"
              aria-label={tPlayer('volume')}
              sx={{
                color: accent.cyan,
                '& .MuiSlider-rail': { opacity: 0.3 },
              }}
            />
          </Stack>

          {/* Móvil — anterior + play + siguiente */}
          <Stack
            direction="row"
            spacing={0.25}
            sx={{
              gridColumn: '2',
              justifySelf: 'end',
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
            }}
          >
            <PlayerControl
              aria-label={tPlayer('previous')}
              onClick={() => actions.prev()}
              disabled={!hasTrack}
              sx={{ width: 32, height: 32 }}
            >
              <SkipBack size={15} className="bs-flip-rtl" />
            </PlayerControl>
            <PlayerControl
              aria-label={isPlaying ? tPlayer('pause') : tPlayer('play')}
              onClick={() => actions.togglePlayPause()}
              disabled={!hasTrack || !playable}
              sx={{
                background: `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 100%)`,
                color: cssVars.textInverse,
                width: 40,
                height: 40,
                '&.Mui-disabled': { color: cssVars.textInverse, opacity: 0.4 },
              }}
            >
              {isLoading ? (
                <Loader2 size={18} className="bs-spin" />
              ) : isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </PlayerControl>
            <PlayerControl
              aria-label={tPlayer('next')}
              onClick={() => actions.next()}
              disabled={!hasTrack}
              sx={{ width: 32, height: 32 }}
            >
              <SkipForward size={15} className="bs-flip-rtl" />
            </PlayerControl>
          </Stack>
        </Box>

      </Box>
    </Box>
    </>
  );
}

function PlayerControl({
  children,
  active,
  sx,
  ...rest
}: React.ComponentProps<typeof IconButton> & { active?: boolean }) {
  return (
    <IconButton
      size="small"
      sx={mergeSx(
        {
          color: active ? accent.cyan : cssVars.textPrimary,
          '&.Mui-disabled': { color: cssVars.textMuted, opacity: 0.4 },
        },
        sx,
      )}
      {...rest}
    >
      {children}
    </IconButton>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
