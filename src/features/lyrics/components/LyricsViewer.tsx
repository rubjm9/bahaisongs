'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Box, Stack, Button, IconButton, Tooltip, Slider, Typography } from '@mui/material';
import { Music2, ChevronUp, ChevronDown, Play, Pause, Maximize2, Plus, Minus, Radio } from 'lucide-react';
import { parseLyrics, parseChordProLyrics, isChordProFormat } from '../lib/chordParser';
import { getCapoAdjustedDisplay } from '../lib/transpose';
import { ChordPair } from './ChordPair';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import type { SyncedLyricLine } from '@/entities/lyrics';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { selectCurrentTrack, useQueueStore } from '@/features/player/stores/queueStore';

interface Props {
  lyrics: string;
  lyricsChordPro?: string | undefined;
  syncedLyrics?: SyncedLyricLine[] | undefined;
  hasChords: boolean;
  trackSlug: string;
  locale: string;
}

function findActiveLineIndex(lines: SyncedLyricLine[], time: number): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (time >= lines[i]!.startTime) return i;
  }
  return 0;
}

export function LyricsViewer({ lyrics, lyricsChordPro, syncedLyrics, hasChords, trackSlug, locale }: Props) {
  const [showChords, setShowChords] = useState(false);
  const [followPlayback, setFollowPlayback] = useState(Boolean(syncedLyrics?.length));
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);
  const [fontSize, setFontSize] = useState(100);
  const [autoscroll, setAutoscroll] = useState(false);
  const [autoscrollSpeed, setAutoscrollSpeed] = useState(30);

  const position = usePlayerStore((s) => s.position);
  const currentTrack = useQueueStore(selectCurrentTrack);
  const isCurrentTrack = currentTrack?.slug === trackSlug;

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  const canFollow = Boolean(syncedLyrics?.length);
  const activeLineIndex = useMemo(() => {
    if (!canFollow || !followPlayback || !isCurrentTrack || !syncedLyrics) return -1;
    return findActiveLineIndex(syncedLyrics, position);
  }, [canFollow, followPlayback, isCurrentTrack, syncedLyrics, position]);

  // Prefer ChordPro inline format when available; fall back to legacy dual-line format
  const stanzas = lyricsChordPro && isChordProFormat(lyricsChordPro)
    ? parseChordProLyrics(lyricsChordPro)
    : parseLyrics(lyrics);

  const startScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const step = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      const scrollAmount = autoscrollSpeed * delta;
      // On desktop the container has no overflow, so scroll the page instead
      const hasOwnScroll = el.scrollHeight > el.clientHeight + 2;

      if (hasOwnScroll) {
        el.scrollTop += scrollAmount;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          setAutoscroll(false);
          return;
        }
      } else {
        window.scrollBy(0, scrollAmount);
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
          setAutoscroll(false);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    lastTimestampRef.current = 0;
    rafRef.current = requestAnimationFrame(step);
  }, [autoscrollSpeed]);

  useEffect(() => {
    if (autoscroll) {
      startScroll();
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimestampRef.current = 0;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoscroll, startScroll]);

  useEffect(() => {
    if (activeLineIndex < 0) return;
    const el = lineRefs.current[activeLineIndex];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLineIndex]);

  const transposeLabel = transpose > 0 ? `+${transpose}` : `${transpose}`;

  if (stanzas.length === 0 && !syncedLyrics?.length) {
    return (
      <Box
        sx={{
          color: cssVars.textMuted,
          fontStyle: 'italic',
          padding: 3,
          background: cssVars.bgGlass,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: `${radii.md}px`,
        }}
      >
        Sin letra disponible todavía.
      </Box>
    );
  }

  const toolbarBtnSx = {
    color: cssVars.textMuted,
    '&:hover': { color: cssVars.textPrimary, background: cssVars.hoverSubtle },
    borderRadius: `${radii.sm}px`,
  };

  return (
    <Box>
      {/* Toolbar */}
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          mb: 2,
          flexWrap: 'wrap',
          gap: 0.5,
          alignItems: 'center',
          background: cssVars.bgGlass,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: `${radii.md}px`,
          px: 1.5,
          py: 0.75,
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Toggle chords */}
        {hasChords ? (
          <Button
            size="small"
            onClick={() => setShowChords((v) => !v)}
            aria-label="Mostrar/ocultar acordes"
            aria-pressed={showChords}
            startIcon={<Music2 size={16} />}
            sx={{
              ...toolbarBtnSx,
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              px: 1,
              color: showChords ? accent.glow : cssVars.textMuted,
              background: showChords ? `${accent.glow}18` : 'transparent',
            }}
          >
            Mostrar/ocultar acordes
          </Button>
        ) : null}

        {canFollow ? (
          <Button
            size="small"
            onClick={() => setFollowPlayback((v) => !v)}
            aria-label="Seguir reproducción"
            aria-pressed={followPlayback}
            startIcon={<Radio size={16} />}
            sx={{
              ...toolbarBtnSx,
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 600,
              px: 1,
              color: followPlayback ? accent.glow : cssVars.textMuted,
              background: followPlayback ? `${accent.glow}18` : 'transparent',
            }}
          >
            Seguir reproducción
          </Button>
        ) : null}

        {/* Transpose controls */}
        {hasChords && showChords ? (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                border: `1px solid ${cssVars.borderSubtle}`,
                borderRadius: `${radii.sm}px`,
                px: 0.5,
              }}
            >
              <Tooltip title="Bajar semitono" arrow>
                <IconButton
                  size="small"
                  onClick={() => setTranspose((v) => v - 1)}
                  sx={toolbarBtnSx}
                >
                  <ChevronDown size={14} />
                </IconButton>
              </Tooltip>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: transpose !== 0 ? accent.glow : cssVars.textMuted,
                  minWidth: 24,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}
              >
                {transposeLabel}
              </Typography>
              <Tooltip title="Subir semitono" arrow>
                <IconButton
                  size="small"
                  onClick={() => setTranspose((v) => v + 1)}
                  sx={toolbarBtnSx}
                >
                  <ChevronUp size={14} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Capo controls */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                border: `1px solid ${cssVars.borderSubtle}`,
                borderRadius: `${radii.sm}px`,
                px: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: cssVars.textMuted,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  px: 0.5,
                }}
              >
                Cejilla
              </Typography>
              <Tooltip title="Reducir cejilla" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => setCapo((v) => Math.max(0, v - 1))}
                    disabled={capo === 0}
                    sx={toolbarBtnSx}
                  >
                    <Minus size={12} />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: capo !== 0 ? accent.glow : cssVars.textMuted,
                  minWidth: 16,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}
              >
                {capo}
              </Typography>
              <Tooltip title="Aumentar cejilla" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => setCapo((v) => Math.min(7, v + 1))}
                    disabled={capo === 7}
                    sx={toolbarBtnSx}
                  >
                    <Plus size={12} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </>
        ) : null}

        {/* Font size */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            border: `1px solid ${cssVars.borderSubtle}`,
            borderRadius: `${radii.sm}px`,
            px: 0.5,
          }}
        >
          <Tooltip title="Reducir tamaño" arrow>
            <span>
              <IconButton
                size="small"
                onClick={() => setFontSize((v) => Math.max(70, v - 10))}
                disabled={fontSize <= 70}
                sx={toolbarBtnSx}
              >
                <Minus size={12} />
              </IconButton>
            </span>
          </Tooltip>
          <Typography
            sx={{
              fontSize: '0.65rem',
              color: cssVars.textMuted,
              fontWeight: 600,
              minWidth: 32,
              textAlign: 'center',
              fontFamily: 'monospace',
            }}
          >
            {fontSize}%
          </Typography>
          <Tooltip title="Aumentar tamaño" arrow>
            <span>
              <IconButton
                size="small"
                onClick={() => setFontSize((v) => Math.min(160, v + 10))}
                disabled={fontSize >= 160}
                sx={toolbarBtnSx}
              >
                <Plus size={12} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Autoscroll toggle */}
        <Tooltip title={autoscroll ? 'Detener autoscroll' : 'Autoscroll'} arrow>
          <IconButton
            size="small"
            onClick={() => setAutoscroll((v) => !v)}
            sx={{
              ...toolbarBtnSx,
              color: autoscroll ? accent.cyan : cssVars.textMuted,
              background: autoscroll ? `${accent.cyan}18` : 'transparent',
              ...(autoscroll
                ? {
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }
                : {}),
            }}
          >
            {autoscroll ? <Pause size={16} /> : <Play size={16} />}
          </IconButton>
        </Tooltip>

        {/* Autoscroll speed slider */}
        {autoscroll ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100, px: 1 }}>
            <Typography
              sx={{ fontSize: '0.65rem', color: cssVars.textMuted, whiteSpace: 'nowrap' }}
            >
              Vel.
            </Typography>
            <Slider
              size="small"
              value={autoscrollSpeed}
              min={10}
              max={80}
              onChange={(_, v) => setAutoscrollSpeed(v as number)}
              sx={{
                color: accent.cyan,
                '& .MuiSlider-thumb': { width: 12, height: 12 },
              }}
            />
          </Box>
        ) : null}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Present link */}
        <Tooltip title="Presentar" arrow>
          <IconButton
            size="small"
            component={Link}
            href={appPath(locale as Locale, `present/${trackSlug}`)}
            sx={toolbarBtnSx}
          >
            <Maximize2 size={16} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Lyrics container */}
      <Box
        ref={containerRef}
        sx={{
          fontFamily: 'var(--bs-font-sans)',
          fontSize: `${fontSize / 100}em`,
          lineHeight: 1.75,
          // Mobile: contain within the viewport so the page isn't absurdly long.
          // Desktop: let lyrics flow to natural height — the page scroll handles it,
          // avoiding a scroll-within-scroll anti-pattern in the 2-column layout.
          maxHeight: { xs: '70vh', md: 'none' },
          overflowY: { xs: 'auto', md: 'visible' },
          scrollbarWidth: 'thin',
          scrollbarColor: `${cssVars.borderSubtle} transparent`,
        }}
      >
        {canFollow && followPlayback ? (
          <Stack spacing={1.5}>
            {syncedLyrics!.map((line, index) => {
              const active = index === activeLineIndex && isCurrentTrack;
              return (
                <Box
                  key={`${line.startTime}-${index}`}
                  ref={(el: HTMLDivElement | null) => {
                    lineRefs.current[index] = el;
                  }}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: `${radii.sm}px`,
                    transition: 'background 0.2s ease, color 0.2s ease',
                    color: active ? cssVars.textPrimary : cssVars.textMuted,
                    background: active ? `${accent.glow}18` : 'transparent',
                    borderLeft: active ? `3px solid ${accent.glow}` : '3px solid transparent',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {line.text}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Stack spacing={3}>
            {stanzas.map((stanza, si) => (
              <Box key={si}>
                {stanza.blocks.map((block, bi) => {
                  const displayBlock =
                    block.chords && capo !== 0
                      ? {
                          ...block,
                          chords: getCapoAdjustedDisplay(block.chords, transpose, capo),
                        }
                      : block;
                  return (
                    <ChordPair
                      key={bi}
                      block={displayBlock}
                      showChords={showChords}
                      transpose={capo !== 0 ? 0 : transpose}
                    />
                  );
                })}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
