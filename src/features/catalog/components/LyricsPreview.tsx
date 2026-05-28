import { Box, Stack } from '@mui/material';
import { cssVars, radii } from '@/shared/theme/tokens';

interface Props {
  lyrics: string;
  /** When true, fades the bottom edge to hint there's more. */
  fade?: boolean;
}

/**
 * Typography-led lyrics block. Phase 3 ships the plain-text rendering; Phase 5
 * will replace this with a ChordPro-aware component that toggles chord
 * overlays, transposition, autoscroll and presentation mode.
 *
 * Empty paragraphs in the source act as stanza breaks — we render each stanza
 * as its own block with vertical rhythm.
 */
export function LyricsPreview({ lyrics, fade = false }: Props) {
  const stanzas = lyrics
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (stanzas.length === 0) {
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

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack
        spacing={3}
        sx={{
          fontFamily: 'var(--bs-font-sans)',
          fontSize: { xs: '1.05rem', md: '1.15rem' },
          lineHeight: 1.65,
          color: cssVars.textPrimary,
          fontWeight: 400,
        }}
      >
        {stanzas.map((stanza, i) => (
          <Box
            key={i}
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {stanza}
          </Box>
        ))}
      </Stack>

      {fade ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: cssVars.lyricsFade,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </Box>
  );
}
