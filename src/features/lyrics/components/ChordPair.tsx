import { Box } from '@mui/material';
import { accent, cssVars } from '@/shared/theme/tokens';
import type { LyricBlock } from '../lib/chordParser';
import { transposeChordLine } from '../lib/transpose';

interface Props {
  block: LyricBlock;
  showChords: boolean;
  /** Semitone offset applied to chord display. */
  transpose: number;
}

/**
 * Renders a single lyric block — optionally with a chord annotation row
 * displayed above the lyric text in a distinct color.
 *
 * Pure display component: no state, no side effects.
 */
export function ChordPair({ block, showChords, transpose }: Props) {
  const hasChords = showChords && Boolean(block.chords);
  const displayChords =
    hasChords && block.chords ? transposeChordLine(block.chords, transpose) : null;

  return (
    <Box sx={{ display: 'inline-block', width: '100%' }}>
      {hasChords && displayChords ? (
        <Box
          aria-hidden
          sx={{
            color: accent.glow,
            fontSize: '0.78em',
            fontWeight: 700,
            letterSpacing: '0.04em',
            lineHeight: 1.3,
            mb: 0.25,
            userSelect: 'none',
            fontFamily: 'monospace',
            whiteSpace: 'pre',
          }}
        >
          {displayChords}
        </Box>
      ) : null}
      <Box
        sx={{
          color: cssVars.textPrimary,
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {block.lyric || ' '}
      </Box>
    </Box>
  );
}
