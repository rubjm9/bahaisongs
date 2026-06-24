'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import {
  LayoutDashboard,
  Music2,
  Tags,
  ListMusic,
  Users,
  Lightbulb,
  Mic2,
  ArrowLeft,
} from 'lucide-react';
import { BrandMark } from '@/shared/ui/BrandMark';
import { cssVars, accent, radii } from '@/shared/theme/tokens';

interface NavItem {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  badge?: number;
}

function buildNavItems(pendingSuggestions?: number): NavItem[] {
  return [
    { href: '/admin', label: 'Inicio', Icon: LayoutDashboard },
    { href: '/admin/tracks', label: 'Canciones', Icon: Music2 },
    { href: '/admin/categories', label: 'Categorías', Icon: Tags },
    { href: '/admin/playlists', label: 'Playlists', Icon: ListMusic },
    { href: '/admin/artists', label: 'Artistas', Icon: Mic2 },
    { href: '/admin/users', label: 'Usuarios', Icon: Users },
    { href: '/admin/suggestions', label: 'Sugerencias', Icon: Lightbulb, ...(pendingSuggestions !== undefined && { badge: pendingSuggestions }) },
  ];
}

interface Props {
  pendingSuggestions?: number | undefined;
}

export function AdminSidebar({ pendingSuggestions }: Props) {
  const pathname = usePathname();
  const navItems = buildNavItems(pendingSuggestions);

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        flexShrink: 0,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        height: 'calc(100dvh - 72px)',
        maxHeight: 'calc(100dvh - 72px)',
        px: 1.5,
        py: 2,
        gap: 0.5,
        background: cssVars.sidebarBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: `1px solid ${cssVars.borderSubtle}`,
        zIndex: 6,
      }}
    >
      {/* Brand */}
      <Box
        component={Link}
        href="/admin"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1.5,
          mb: 1,
          textDecoration: 'none',
          borderRadius: `${radii.md}px`,
          '&:hover': { background: cssVars.hoverSubtle },
        }}
      >
        <BrandMark icon="monogram" showWordmark={false} size={28} />
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: cssVars.textMuted,
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            Admin
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: cssVars.textPrimary, fontWeight: 600, lineHeight: 1.4 }}
          >
            BahaiSongs
          </Typography>
        </Box>
      </Box>

      {/* Nav items */}
      <Stack sx={{ flex: 1 }} spacing={0.5}>
        {navItems.map(({ href, label, Icon, badge }) => {
          const active = isActive(href);
          return (
            <Tooltip key={href} title="" placement="right">
              <Box
                component={Link}
                href={href}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: `${radii.md}px`,
                  textDecoration: 'none',
                  color: active ? cssVars.textPrimary : cssVars.textMuted,
                  background: active ? cssVars.navActiveBg : 'transparent',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.875rem',
                  minHeight: 40,
                  position: 'relative',
                  transition: 'background 160ms, color 160ms',
                  cursor: 'pointer',
                  '&:hover': {
                    background: active ? cssVars.navActiveBg : cssVars.hoverSubtle,
                    color: cssVars.textPrimary,
                  },
                }}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.75} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge != null && badge > 0 && (
                  <Box
                    sx={{
                      minWidth: 18,
                      height: 18,
                      borderRadius: '9px',
                      background: accent.electric,
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: 0.5,
                    }}
                  >
                    {badge > 99 ? '99+' : badge}
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Stack>

      {/* Back to site */}
      <Box
        component={Link}
        href="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1,
          borderRadius: `${radii.md}px`,
          textDecoration: 'none',
          color: cssVars.textMuted,
          fontSize: '0.8125rem',
          minHeight: 40,
          transition: 'background 160ms, color 160ms',
          cursor: 'pointer',
          '&:hover': { background: cssVars.hoverSubtle, color: cssVars.textPrimary },
        }}
      >
        <ArrowLeft size={16} />
        <span>Volver al sitio</span>
      </Box>
    </Box>
  );
}
