'use client';

import { useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player/youtube';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../stores/playerStore';
import { useQueueStore, selectCurrentTrack } from '../stores/queueStore';
import { resolveSource } from '../lib/sourceResolver';
import { accent, cssVars, radii } from '@/shared/theme/tokens';

/**
 * Floating YouTube video window. Renders only when the active track resolves
 * to a YouTube source. Synchronises play / pause / seek / volume with the
 * global Zustand player store and reports events back into it.
 *
 * Mount this component exactly once in the layout (inside PlayerBar) and let
 * it manage its own visibility — no extra rendering logic needed at the call
 * site.
 */
export function YoutubeFloatingPlayer() {
  const playerRef = useRef<ReactPlayer | null>(null);

  const current = useQueueStore((s) => selectCurrentTrack(s));
  const status = usePlayerStore((s) => s.status);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const repeat = usePlayerStore((s) => s.repeat);
  const seekTrigger = usePlayerStore((s) => s.seekTrigger);
  const youtubePlayerOpen = usePlayerStore((s) => s.youtubePlayerOpen);

  const source = current ? resolveSource(current) : null;

  // Imperative seek whenever seekTrigger changes
  useEffect(() => {
    if (!seekTrigger || !playerRef.current) return;
    playerRef.current.seekTo(seekTrigger.seconds, 'seconds');
  }, [seekTrigger]);

  const handlePlay = useCallback(() => {
    usePlayerStore.getState().setStatus('playing');
  }, []);

  const handlePause = useCallback(() => {
    if (usePlayerStore.getState().status !== 'error') {
      usePlayerStore.getState().setStatus('paused');
    }
  }, []);

  const handleBuffer = useCallback(() => {
    usePlayerStore.getState().setStatus('loading');
  }, []);

  const handleBufferEnd = useCallback(() => {
    if (usePlayerStore.getState().status === 'loading') {
      usePlayerStore.getState().setStatus('playing');
    }
  }, []);

  const handleProgress = useCallback(({ playedSeconds }: { playedSeconds: number }) => {
    usePlayerStore.getState().setPosition(playedSeconds);
  }, []);

  const handleDuration = useCallback((duration: number) => {
    usePlayerStore.getState().setDuration(duration);
  }, []);

  const handleEnded = useCallback(() => {
    const { repeat: r } = usePlayerStore.getState();
    if (r === 'one') {
      usePlayerStore.getState().setSeekTrigger(0);
      // Re-trigger play by setting status back to loading
      usePlayerStore.getState().setStatus('loading');
      return;
    }
    const nextTrack = useQueueStore.getState().next();
    if (!nextTrack && r === 'all') {
      useQueueStore.getState().jumpTo(0);
    } else if (!nextTrack) {
      usePlayerStore.getState().setStatus('idle');
    }
  }, []);

  const handleError = useCallback(() => {
    usePlayerStore.getState().setStatus('error');
    usePlayerStore.getState().setError('youtube-playback-failed');
  }, []);

  if (!current || source?.kind !== 'youtube') return null;

  const videoId = source.videoId;
  const playing = status === 'playing' || status === 'loading';
  const loop = repeat === 'one';

  return (
    <AnimatePresence>
      <Box
        component={motion.div}
        key="yt-floating"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.19, 1, 0.22, 1] }}
        sx={{
          position: 'fixed',
          right: { xs: 8, md: 16 },
          bottom: {
            xs: 'calc(108px + env(safe-area-inset-bottom, 0px))',
            md: 100,
          },
          zIndex: 9,
          width: { xs: 256, sm: 296 },
          borderRadius: `${radii.md}px`,
          background: cssVars.bgGlass,
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          border: `1px solid ${cssVars.borderStrong}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.40), 0 0 0 1px rgba(79,209,255,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            px: 1.5,
            py: 0.75,
            borderBottom: `1px solid ${cssVars.borderSubtle}`,
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: accent.cyan,
              boxShadow: `0 0 8px ${accent.cyan}`,
              flexShrink: 0,
              animation: playing ? 'bs-pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          <Typography
            noWrap
            sx={{
              flex: 1,
              fontSize: '0.7rem',
              fontWeight: 600,
              color: cssVars.textPrimary,
              letterSpacing: '0.02em',
            }}
          >
            {current.title}
          </Typography>
          <IconButton
            size="small"
            aria-label={youtubePlayerOpen ? 'Minimizar vídeo' : 'Mostrar vídeo'}
            onClick={() =>
              usePlayerStore.getState().setYoutubePlayerOpen(!youtubePlayerOpen)
            }
            sx={{
              width: 22,
              height: 22,
              color: cssVars.textMuted,
              '&:hover': { color: cssVars.textPrimary },
            }}
          >
            {youtubePlayerOpen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </IconButton>
          <IconButton
            size="small"
            aria-label="Cerrar vídeo y detener"
            onClick={() => {
              useQueueStore.getState().clear();
              usePlayerStore.getState().reset();
            }}
            sx={{
              width: 22,
              height: 22,
              color: cssVars.textMuted,
              '&:hover': { color: cssVars.textPrimary },
            }}
          >
            <X size={12} />
          </IconButton>
        </Stack>

        {/* Video area (collapsible) */}
        <AnimatePresence initial={false}>
          {youtubePlayerOpen && (
            <Box
              component={motion.div}
              key="yt-video"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.19, 1, 0.22, 1] }}
              sx={{ overflow: 'hidden' }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '56.25%', // 16:9 aspect ratio
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <ReactPlayer
                    ref={playerRef}
                    url={`https://www.youtube.com/watch?v=${videoId}`}
                    playing={playing}
                    volume={volume}
                    muted={muted}
                    loop={loop}
                    width="100%"
                    height="100%"
                    progressInterval={800}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onBuffer={handleBuffer}
                    onBufferEnd={handleBufferEnd}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onEnded={handleEnded}
                    onError={handleError}
                    config={{
                      playerVars: {
                        rel: 0,
                        modestbranding: 1,
                        playsinline: 1,
                      },
                    }}
                  />
                </Box>
              </Box>
              {/* YouTube attribution */}
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  borderTop: `1px solid ${cssVars.borderSubtle}`,
                }}
              >
                <Box
                  component="span"
                  sx={{ fontSize: '0.62rem', color: cssVars.textMuted, lineHeight: 1 }}
                >
                  Fuente:
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#FF0000',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  YouTube
                </Box>
              </Box>
            </Box>
          )}
        </AnimatePresence>
      </Box>
    </AnimatePresence>
  );
}
