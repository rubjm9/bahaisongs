'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Box, Stack } from '@mui/material';
import { SearchPalette } from '@/features/catalog/components/SearchPalette';
import { LocaleSwitcher } from '@/features/auth/components/LocaleSwitcher';
import { ThemeSwitcher } from '@/features/auth/components/ThemeSwitcher';
import { AuthMenu } from '@/features/auth/components/AuthMenu';
import { BrandMark } from './BrandMark';
import { cssVars } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';

export function TopBar() {
  const locale = useLocale() as Locale;

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        paddingX: { xs: 2, md: 4 },
        paddingY: 2,
        background: cssVars.topBarFade,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${cssVars.borderSubtle}`,
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
          {/* Brand mark — visible only on mobile where the sidebar is hidden */}
          <Link
            href={`/${locale}`}
            aria-label="BahaiSongs"
            style={{ textDecoration: 'none', display: 'flex', flexShrink: 0 }}
          >
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <BrandMark icon="monogram" showWordmark={false} size={28} />
            </Box>
          </Link>
          <SearchPalette />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <ThemeSwitcher />
          <LocaleSwitcher />
          <AuthMenu />
        </Stack>
      </Stack>
    </Box>
  );
}
