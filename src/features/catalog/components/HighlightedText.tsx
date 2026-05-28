'use client';

import { Fragment } from 'react';
import { Box } from '@mui/material';
import { accent } from '@/shared/theme/tokens';

interface Props {
  text: string;
  /** Inclusive [start, end] ranges as returned by Fuse. */
  ranges: readonly (readonly [number, number])[];
}

/**
 * Renders `text` with the matched ranges visually highlighted. Ranges are
 * pre-sorted and may overlap (Fuse occasionally emits overlapping pairs);
 * we merge them defensively.
 */
export function HighlightedText({ text, ranges }: Props) {
  if (ranges.length === 0) return <>{text}</>;

  const merged = mergeRanges(ranges);
  const segments: { from: number; to: number; hit: boolean }[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ from: cursor, to: start, hit: false });
    segments.push({ from: start, to: end + 1, hit: true });
    cursor = end + 1;
  }
  if (cursor < text.length) segments.push({ from: cursor, to: text.length, hit: false });

  return (
    <>
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {seg.hit ? (
            <Box
              component="mark"
              sx={{
                background: 'transparent',
                color: accent.cyan,
                fontWeight: 600,
              }}
            >
              {text.slice(seg.from, seg.to)}
            </Box>
          ) : (
            <>{text.slice(seg.from, seg.to)}</>
          )}
        </Fragment>
      ))}
    </>
  );
}

function mergeRanges(
  ranges: readonly (readonly [number, number])[],
): (readonly [number, number])[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1] + 1) {
      last[1] = Math.max(last[1], r[1]);
    } else {
      merged.push([r[0], r[1]]);
    }
  }
  return merged;
}
