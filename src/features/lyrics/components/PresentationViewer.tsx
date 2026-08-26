'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stack, IconButton, Tooltip, Typography } from '@mui/material';
import { X, Music2, ChevronUp, ChevronDown, Play, Pause, Plus, Minus } from 'lucide-react';
import { parseLyrics, parseChordProLyrics, isChordProFormat } from '../lib/chordParser';
import { getCapoAdjustedDisplay } from '../lib/transpose';
import { ChordPair } from './ChordPair';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import { track } from '@/shared/lib/analytics/track';

interface Props {
  lyrics: string;
  lyricsChordPro?: string | undefined;
  hasChords: boolean;
  trackTitle: string;
  artistName: string;
  locale: string;
  songSlug: string;
}

export function PresentationViewer({
  lyrics,
  lyricsChordPro,
  hasChords,
  trackTitle,
  artistName,
  locale: _locale,
  songSlug,
}: Props) {
  const router = useRouter();

  const [showChords, setShowChords] = useState(hasChords);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);
  const [fontSize, setFontSize] = useState(140);
  const [autoscroll, setAutoscroll] = useState(false);
  const [autoscrollSpeed, setAutoscrollSpeed] = useState(30);
  const [hudVisible, setHudVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const hudTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const touchStartYRef = useRef<number>(0);

  const stanzas = lyricsChordPro && isChordProFormat(lyricsChordPro)
    ? parseChordProLyrics(lyricsChordPro)
    : parseLyrics(lyrics);

  // HUD fade after 3s of no interaction
  const resetHudTimer = useCallback(() => {
    setHudVisible(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => setHudVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHudTimer();
    return () => {
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [resetHudTimer]);

  useEffect(() => {
    track('view_item', { item_id: songSlug });
  }, [songSlug]);

  // Autoscroll
  const startScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const step = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      el.scrollTop += autoscrollSpeed * delta;

      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        setAutoscroll(false);
        return;
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      resetHudTimer();
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key) {
        case 'Escape':
          router.back();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFontSize((v) => Math.min(220, v + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFontSize((v) => Math.max(80, v - 10));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setAutoscrollSpeed((v) => Math.max(10, v - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setAutoscrollSpeed((v) => Math.min(80, v + 5));
          break;
        case ' ':
          e.preventDefault();
          setAutoscroll((v) => !v);
          break;
        case '+':
        case '=':
          setTranspose((v) => v + 1);
          break;
        case '-':
          setTranspose((v) => v - 1);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [router, resetHudTimer]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartYRef.current = e.touches[0]?.clientY ?? 0;
      resetHudTimer();
    },
    [resetHudTimer],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const deltaY = touchStartYRef.current - (e.touches[0]?.clientY ?? 0);
    el.scrollTop += deltaY * 0.5;
    touchStartYRef.current = e.touches[0]?.clientY ?? 0;
  }, []);

  const transposeLabel = transpose > 0 ? `+${transpose}` : `${transpose}`;

  const toolbarBtnSx = {
    color: cssVars.textMuted,
    '&:hover': { color: cssVars.textPrimary, background: cssVars.hoverSubtle },
    borderRadius: `${radii.sm}px`,
  };

  return (
    <Box
      onMouseMove={resetHudTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: cssVars.bgPrimary,
        // Aurora animation layer (on top of bg)
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 20% 30%, ${accent.indigo}22 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 70%, ${accent.cyan}18 0%, transparent 50%),
                       radial-gradient(ellipse at 50% 50%, ${accent.glow}11 0%, transparent 60%)`,
          '@keyframes auroraPresent': {
            '0%': { opacity: 0.6, transform: 'scale(1)' },
            '50%': { opacity: 1, transform: 'scale(1.05)' },
            '100%': { opacity: 0.6, transform: 'scale(1)' },
          },
          animation: 'auroraPresent 8s ease-in-out infinite',
          pointerEvents: 'none',
        },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Exit button — always visible */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10001,
        }}
      >
        <Tooltip title="Salir (Esc)" arrow>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: cssVars.textMuted,
              background: cssVars.bgGlass,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${cssVars.borderSubtle}`,
              '&:hover': { color: cssVars.textPrimary, background: cssVars.hoverSubtle },
            }}
          >
            <X size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Title area */}
      <Box
        sx={{
          pt: { xs: 4, md: 5 },
          pb: 2,
          px: { xs: 3, md: 6 },
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '1.6rem', md: '2.2rem' },
            fontWeight: 800,
            lineHeight: 1.15,
            fontFamily: "var(--bs-font-display), 'Outfit', system-ui, sans-serif",
            background: `linear-gradient(135deg, ${accent.cyan} 0%, ${accent.glow} 50%, ${accent.indigo} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {trackTitle}
        </Typography>
        {artistName ? (
          <Typography
            sx={{
              color: cssVars.textMuted,
              fontSize: { xs: '0.85rem', md: '1rem' },
              mt: 0.5,
              fontWeight: 400,
            }}
          >
            {artistName}
          </Typography>
        ) : null}
      </Box>

      {/* Lyrics scrollable area */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 3, md: 8, lg: 16 },
          // Extra bottom room so the final lyrics lines can scroll above the HUD controls.
          pb: { xs: 24, md: 28 },
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Stack spacing={4} sx={{ maxWidth: 900, mx: 'auto' }}>
          {stanzas.map((stanza, si) => (
            <Box
              key={si}
              sx={{
                fontFamily: 'var(--bs-font-sans)',
                fontSize: `${fontSize / 100}rem`,
                lineHeight: 1.8,
                color: cssVars.textPrimary,
              }}
            >
              {stanza.blocks.map((block, bi) => {
                const displayBlock =
                  block.chords && capo !== 0
                    ? { ...block, chords: getCapoAdjustedDisplay(block.chords, transpose, capo) }
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
      </Box>

      {/* HUD overlay at bottom */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          background: cssVars.topBarFade,
          pt: 6,
          pb: 2,
          px: { xs: 2, md: 4 },
          transition: 'opacity 400ms ease',
          opacity: hudVisible ? 1 : 0,
          pointerEvents: hudVisible ? 'auto' : 'none',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}
        >
          {/* Chords toggle */}
          {hasChords ? (
            <Tooltip title="Acordes" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  setShowChords((v) => !v);
                  resetHudTimer();
                }}
                sx={{
                  ...toolbarBtnSx,
                  color: showChords ? accent.glow : cssVars.textMuted,
                  background: showChords ? `${accent.glow}22` : 'transparent',
                }}
              >
                <Music2 size={18} />
              </IconButton>
            </Tooltip>
          ) : null}

          {/* Transpose */}
          {hasChords && showChords ? (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title="Bajar semitono (-)" arrow>
                <IconButton
                  size="small"
                  onClick={() => {
                    setTranspose((v) => v - 1);
                    resetHudTimer();
                  }}
                  sx={toolbarBtnSx}
                >
                  <ChevronDown size={16} />
                </IconButton>
              </Tooltip>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: transpose !== 0 ? accent.glow : cssVars.textMuted,
                  minWidth: 28,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                }}
              >
                {transposeLabel}
              </Typography>
              <Tooltip title="Subir semitono (+)" arrow>
                <IconButton
                  size="small"
                  onClick={() => {
                    setTranspose((v) => v + 1);
                    resetHudTimer();
                  }}
                  sx={toolbarBtnSx}
                >
                  <ChevronUp size={16} />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : null}

          {/* Font size */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title="Reducir tamaño (↓)" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    setFontSize((v) => Math.max(80, v - 10));
                    resetHudTimer();
                  }}
                  disabled={fontSize <= 80}
                  sx={toolbarBtnSx}
                >
                  <Minus size={14} />
                </IconButton>
              </span>
            </Tooltip>
            <Typography
              sx={{
                fontSize: '0.72rem',
                color: cssVars.textMuted,
                fontFamily: 'monospace',
                minWidth: 36,
                textAlign: 'center',
              }}
            >
              {fontSize}%
            </Typography>
            <Tooltip title="Aumentar tamaño (↑)" arrow>
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    setFontSize((v) => Math.min(220, v + 10));
                    resetHudTimer();
                  }}
                  disabled={fontSize >= 220}
                  sx={toolbarBtnSx}
                >
                  <Plus size={14} />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Autoscroll */}
          <Tooltip title={autoscroll ? 'Detener (Espacio)' : 'Autoscroll (Espacio)'} arrow>
            <IconButton
              size="small"
              onClick={() => {
                setAutoscroll((v) => !v);
                resetHudTimer();
              }}
              sx={{
                ...toolbarBtnSx,
                color: autoscroll ? accent.cyan : cssVars.textMuted,
                background: autoscroll ? `${accent.cyan}22` : 'transparent',
              }}
            >
              {autoscroll ? <Pause size={18} /> : <Play size={18} />}
            </IconButton>
          </Tooltip>

          {/* Capo */}
          {hasChords && showChords ? (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: cssVars.textMuted,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Cejilla
              </Typography>
              <Tooltip title="Reducir cejilla" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setCapo((v) => Math.max(0, v - 1));
                      resetHudTimer();
                    }}
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
                    onClick={() => {
                      setCapo((v) => Math.min(7, v + 1));
                      resetHudTimer();
                    }}
                    disabled={capo === 7}
                    sx={toolbarBtnSx}
                  >
                    <Plus size={12} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ) : null}
        </Stack>

        {/* Key hints */}
        <Typography
          sx={{
            textAlign: 'center',
            fontSize: '0.62rem',
            color: cssVars.textMuted,
            mt: 1,
            letterSpacing: '0.04em',
          }}
        >
          Espacio: scroll · +/- tono · ↑↓ tamaño · ESC salir
        </Typography>
      </Box>
    </Box>
  );
}
