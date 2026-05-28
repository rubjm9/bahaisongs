'use client';

import { Box, Stack, Chip } from '@mui/material';
import { Music, Mic2 } from 'lucide-react';
import Link from 'next/link';
import { HighlightedText } from './HighlightedText';
import { TrackPlaceholder } from './TrackPlaceholder';
import type { SearchResult } from '@/features/catalog/lib/search-engine';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import { trackPath } from '@/shared/lib/seo/paths';

interface Props {
  result: SearchResult;
  locale: string;
  active?: boolean;
  /** Optional ref hook for keyboard scroll-into-view. */
  itemRef?: (node: HTMLAnchorElement | null) => void;
  onSelect?: () => void;
}

export function SearchResultItem({ result, locale: _locale, active = false, itemRef, onSelect }: Props) {
  const { entry, matches } = result;
  const href = trackPath(entry.slug);
  const titleRanges = matches.get('title') ?? [];
  const snippetRanges = matches.get('snippet') ?? [];

  return (
    <Link
      {...(itemRef ? { ref: itemRef } : {})}
      href={href}
      {...(onSelect ? { onClick: onSelect } : {})}
      role="option"
      aria-selected={active}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'center',
          paddingX: 1.5,
          paddingY: 1.25,
          borderRadius: `${radii.md}px`,
          border: `1px solid ${active ? cssVars.borderStrong : 'transparent'}`,
          background: active ? cssVars.navActiveBg : 'transparent',
          transition: 'background-color 120ms, border-color 120ms',
          '&:hover': {
            background: cssVars.hoverSubtle,
          },
        }}
      >
        <TrackPlaceholder title={entry.title} size={40} />

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              color: cssVars.textPrimary,
              fontWeight: 600,
              fontSize: '0.95rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <HighlightedText text={entry.title} ranges={titleRanges} />
          </Box>
          <Box
            sx={{
              color: cssVars.textMuted,
              fontSize: '0.78rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {snippetRanges.length > 0 ? (
              <HighlightedText text={entry.snippet} ranges={snippetRanges} />
            ) : (
              entry.artist
            )}
          </Box>
        </Box>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexShrink: 0 }}>
          {entry.hasAudio ? (
            <Chip
              size="small"
              icon={<Music size={12} />}
              label={entry.language.toUpperCase()}
              sx={{
                background: cssVars.navActiveBg,
                color: accent.cyan,
                border: `1px solid ${cssVars.borderSubtle}`,
                fontSize: '0.65rem',
                fontWeight: 600,
                height: 22,
                '& .MuiChip-icon': { color: accent.cyan, ml: 0.5 },
              }}
            />
          ) : (
            <Chip
              size="small"
              label={entry.language.toUpperCase()}
              sx={{
                background: cssVars.hoverSubtle,
                color: cssVars.textMuted,
                border: `1px solid ${cssVars.borderSubtle}`,
                fontSize: '0.65rem',
                fontWeight: 600,
                height: 22,
              }}
            />
          )}
          {entry.hasChords ? (
            <Box
              aria-label="Has chords"
              title="Acordes disponibles"
              sx={{
                color: accent.glow,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              <Mic2 size={14} />
            </Box>
          ) : null}
        </Stack>
      </Stack>
    </Link>
  );
}
