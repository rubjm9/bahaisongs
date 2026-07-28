'use client';

import { Box } from '@mui/material';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AtmosphereBackground } from './AtmosphereBackground';
import { PlayerBar } from '@/features/player/components/PlayerBar';
import { MobileBottomNav } from './MobileBottomNav';
import { WhatsAppShareButton } from './WhatsAppShareButton';
import { cssVars, accent } from '@/shared/theme/tokens';
import { useSidebarCollapsed } from '@/shared/hooks/useSidebarCollapsed';
import { AuthPrefetch } from '@/features/auth/components/AuthPrefetch';
import {
  DESKTOP_CONTENT_PADDING_BOTTOM,
  MOBILE_CONTENT_PADDING_BOTTOM,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from './shellLayout';

interface Props {
  children: ReactNode;
}

/**
 * Public shell: sidebar (desktop) + bottom nav (mobile) + topbar + content +
 * persistent player bar. The atmosphere background is fixed so it survives
 * route transitions.
 *
 * The PlayerBar is mounted exactly once here — Phase 4 will add the single
 * `<audio>` element to it; no other route is allowed to mount one.
 */
export function AppShell({ children }: Props) {
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
  const tCommon = useTranslations('common');

  return (
    <>
      <AuthPrefetch />
      <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        position: 'relative',
        '--bs-sidebar-width': { xs: '0px', md: `${sidebarWidth}px` },
      }}
    >
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: '-100%',
          top: 8,
          zIndex: 9999,
          background: accent.electric,
          color: '#fff',
          px: 2,
          py: 1,
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontWeight: 600,
          textDecoration: 'none',
          '&:focus': { left: 8 },
        }}
      >
        {tCommon('skipToContent')}
      </Box>

      <AtmosphereBackground intensity="low" fixed />

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: {
            xs: MOBILE_CONTENT_PADDING_BOTTOM,
            md: DESKTOP_CONTENT_PADDING_BOTTOM,
          },
        }}
      >
        <TopBar />

        <Box
          component="main"
          id="main-content"
          sx={{
            flex: 1,
            paddingX: { xs: 2, md: 4 },
            paddingY: { xs: 3, md: 5 },
            color: cssVars.textPrimary,
            position: 'relative',
          }}
        >
          {children}
        </Box>
      </Box>

      <PlayerBar />
      <MobileBottomNav />
      <WhatsAppShareButton />
    </Box>
    </>
  );
}
