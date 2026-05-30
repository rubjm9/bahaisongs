'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Box, Stack } from '@mui/material';
import { Home, Search, Library, Heart } from 'lucide-react';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath, isAppPathActive } from '@/shared/lib/seo/paths';

const items: {
  href: string;
  labelKey: 'home' | 'search' | 'library' | 'favorites';
  Icon: typeof Home;
}[] = [
  { href: '', labelKey: 'home', Icon: Home },
  { href: 'search', labelKey: 'search', Icon: Search },
  { href: 'library', labelKey: 'library', Icon: Library },
  { href: 'favorites', labelKey: 'favorites', Icon: Heart },
];

/** Nav links row — embedded inside the mobile player bar (not fixed on its own). */
export function MobileNavLinks() {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname() ?? appPath(locale);

  return (
    <Box component="nav" aria-label="Primary">
      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'space-between' }}>
        {items.map(({ href, labelKey, Icon }) => {
          const fullHref = appPath(locale, href);
          const isActive = isAppPathActive(locale, href, pathname);
          return (
            <Link
              key={labelKey}
              href={fullHref}
              aria-label={t(labelKey)}
              aria-current={isActive ? 'page' : undefined}
              style={{ flex: 1, textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingY: 0.5,
                  gap: 0.25,
                  borderRadius: `${radii.sm}px`,
                  color: isActive ? accent.cyan : cssVars.textMuted,
                  background: isActive ? cssVars.navActiveBg : 'transparent',
                  transition: 'color 160ms, background-color 160ms',
                }}
              >
                <Icon size={18} aria-hidden />
                <Box component="span" sx={{ fontSize: '0.6rem', fontWeight: 500 }}>
                  {t(labelKey)}
                </Box>
              </Box>
            </Link>
          );
        })}
      </Stack>
    </Box>
  );
}
