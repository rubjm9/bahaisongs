'use client';

import Image from 'next/image';
import { Box } from '@mui/material';
import { cssVars } from '@/shared/theme/tokens';

/** Trimmed lockup derived from /icons/logo-bahaisongs.png — see npm run brand:logo */
const LOGO_ASPECT = 555 / 253;
const BRAND_LOGO_SRC = '/icons/logo-lockup.png';
const BRAND_ICON_SRC = '/icons/icon-lockup.png';

interface Props {
  /** Icon edge (px) when compact; logo width (px) when full lockup. */
  size?: number;
  label?: string;
  /** Full horizontal lockup when true; compact play-icon mark when false. */
  showWordmark?: boolean;
}

export function BrandMark({
  size = 32,
  label = 'BahaiSongs.org',
  showWordmark = true,
}: Props) {
  const width = showWordmark ? size : size;
  const height = showWordmark ? Math.round(size / LOGO_ASPECT) : size;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        userSelect: 'none',
        color: cssVars.textPrimary,
      }}
      aria-label={label}
    >
      <Image
        src={showWordmark ? BRAND_LOGO_SRC : BRAND_ICON_SRC}
        alt=""
        width={width}
        height={height}
        priority={showWordmark}
        style={{
          width,
          height: showWordmark ? 'auto' : height,
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </Box>
  );
}
