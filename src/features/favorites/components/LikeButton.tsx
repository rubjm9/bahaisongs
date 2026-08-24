'use client';

import { useId } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { accent, cssVars } from '@/shared/theme/tokens';
import { useLikes } from '../hooks/useLikes';

interface Props {
  trackId: string;
  trackSlug?: string;
  /** Icon pixel size (default 20). */
  size?: number;
}

export function LikeButton({ trackId, trackSlug, size = 20 }: Props) {
  const t = useTranslations('auth');
  const gradId = useId().replace(/:/g, '');
  const id = trackId.length > 0 ? trackId : (trackSlug ?? '');
  const { likedIds, toggle } = useLikes();
  const isLiked = likedIds.has(id) || (trackSlug !== undefined && likedIds.has(trackSlug));

  return (
    <Tooltip title={isLiked ? t('unlikeTrack') : t('likeTrack')} arrow>
      <span>
        <IconButton
          aria-label={isLiked ? t('unlikeTrack') : t('likeTrack')}
          size="small"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(id);
          }}
          sx={{
            color: isLiked ? accent.cyan : cssVars.textMuted,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            p: 0.5,
            transition: 'color 160ms, transform 160ms',
            '&:hover': {
              color: accent.cyan,
              background: 'transparent',
              boxShadow: 'none',
              transform: 'translateY(-1px)',
            },
          }}
        >
          {isLiked ? (
            <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={accent.electric} />
                  <stop offset="55%" stopColor={accent.cyan} />
                  <stop offset="100%" stopColor={accent.glow} />
                </linearGradient>
              </defs>
              <path
                d="M19.84 4.61a5.5 5.5 0 0 0-7.78 0L12 4.67l-.06-.06a5.5 5.5 0 0 0-7.78 7.78l.06.06L12 20.23l7.78-7.78.06-.06a5.5 5.5 0 0 0 0-7.78Z"
                fill={`url(#${gradId})`}
                stroke={`url(#${gradId})`}
                strokeWidth="0.75"
                style={{ filter: `drop-shadow(0 0 8px ${accent.cyan}88)` }}
              />
            </svg>
          ) : (
            <Heart size={size} fill="none" strokeWidth={2} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
