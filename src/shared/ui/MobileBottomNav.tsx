'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Box, Stack } from '@mui/material';
import { Compass, Home, Library, Search, UserCircle } from 'lucide-react';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import { MOBILE_NAV_HEIGHT } from './shellLayout';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath, isAppPathActive } from '@/shared/lib/seo/paths';
import { useUser } from '@/features/auth/hooks/useUser';
import { LoginModal } from '@/features/auth/components/LoginModal';
import { UserAvatar } from '@/features/auth/components/UserAvatar';

type NavItem =
  | { kind: 'link'; href: string; labelKey: 'home' | 'discover' | 'library'; Icon: typeof Home }
  | { kind: 'search'; labelKey: 'search'; Icon: typeof Search }
  | { kind: 'auth'; labelKey: 'profile'; Icon: typeof UserCircle };

const NAV_ITEMS: NavItem[] = [
  { kind: 'link', href: '', labelKey: 'home', Icon: Home },
  { kind: 'link', href: 'discover', labelKey: 'discover', Icon: Compass },
  { kind: 'search', labelKey: 'search', Icon: Search },
  { kind: 'link', href: 'library', labelKey: 'library', Icon: Library },
  { kind: 'auth', labelKey: 'profile', Icon: UserCircle },
];

/** Fixed 5-item bottom navigation bar for mobile. Replaces the nav embedded in PlayerBar. */
export function MobileBottomNav() {
  const tNav = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const pathname = usePathname() ?? appPath(locale);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, profile } = useUser();

  return (
    <>
      <Box
        component="nav"
        aria-label="Primary"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9,
          height: `calc(${MOBILE_NAV_HEIGHT} + env(safe-area-inset-bottom, 0px))`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: cssVars.bgGlass,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${cssVars.borderSubtle}`,
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
        }}
      >
        <Stack
          direction="row"
          sx={{ width: '100%', height: MOBILE_NAV_HEIGHT, alignItems: 'center' }}
        >
          {NAV_ITEMS.map((item) => {
            if (item.kind === 'search') {
              const isActive = isAppPathActive(locale, 'discover', pathname);
              return (
                <Link
                  key="search"
                  href={appPath(locale, 'discover')}
                  aria-label={tNav('discover')}
                  aria-current={isActive ? 'page' : undefined}
                  style={{ flex: 1, textDecoration: 'none' }}
                >
                  <NavItemContent
                    Icon={item.Icon}
                    label={tNav('discover')}
                    isActive={isActive}
                  />
                </Link>
              );
            }

            if (item.kind === 'auth') {
              return (
                <Box
                  key="auth"
                  component="button"
                  onClick={() => { if (!user) setLoginOpen(true); }}
                  aria-label={user ? tAuth('profile') : tAuth('signIn')}
                  sx={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.25,
                    paddingY: 0.5,
                    borderRadius: `${radii.sm}px`,
                    color: cssVars.textMuted,
                  }}
                >
                  {user ? (
                    <UserAvatar profile={profile} />
                  ) : (
                    <>
                      <item.Icon size={22} aria-hidden />
                      <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 500, lineHeight: 1 }}>
                        {tAuth('signIn')}
                      </Box>
                    </>
                  )}
                </Box>
              );
            }

            const fullHref = appPath(locale, item.href);
            const isActive = isAppPathActive(locale, item.href, pathname);
            return (
              <Link
                key={item.labelKey}
                href={fullHref}
                aria-label={tNav(item.labelKey as 'home' | 'discover' | 'library')}
                aria-current={isActive ? 'page' : undefined}
                style={{ flex: 1, textDecoration: 'none' }}
              >
                <NavItemContent
                  Icon={item.Icon}
                  label={tNav(item.labelKey as 'home' | 'discover' | 'library')}
                  isActive={isActive}
                />
              </Link>
            );
          })}
        </Stack>
      </Box>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

function NavItemContent({
  Icon,
  label,
  isActive,
}: {
  Icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  label: string;
  isActive: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingY: 0.5,
        gap: 0.25,
        borderRadius: `${radii.sm}px`,
        color: isActive ? accent.cyan : cssVars.textMuted,
        background: isActive ? cssVars.navActiveBg : 'transparent',
        transition: 'color 160ms, background-color 160ms',
        mx: 0.5,
      }}
    >
      <Icon size={22} aria-hidden />
      <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 500, lineHeight: 1 }}>
        {label}
      </Box>
    </Box>
  );
}
