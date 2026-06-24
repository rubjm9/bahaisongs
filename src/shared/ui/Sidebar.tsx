'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import { Compass, Home, Library, ListMusic, MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { SidebarPlaylists } from './SidebarPlaylists';
import { cssVars, radii, accent } from '@/shared/theme/tokens';
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from './shellLayout';
import { useQueueStore, selectCurrentTrack } from '@/features/player/stores/queueStore';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath, isAppPathActive, trackPath } from '@/shared/lib/seo/paths';

interface NavItem {
  href: string;
  labelKey: 'home' | 'discover' | 'library' | 'publicPlaylists' | 'suggest';
  Icon: typeof Home;
}

const navItems: NavItem[] = [
  { href: '', labelKey: 'home', Icon: Home },
  { href: 'discover', labelKey: 'discover', Icon: Compass },
  { href: 'library', labelKey: 'library', Icon: Library },
  { href: 'public-playlists', labelKey: 'publicPlaylists', Icon: ListMusic },
  { href: 'suggest', labelKey: 'suggest', Icon: MessageSquarePlus },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const locale = useLocale() as Locale;
  const pathname = usePathname() ?? appPath(locale);
  const current = useQueueStore((s) => selectCurrentTrack(s));
  const isPlaying = usePlayerStore((s) => s.status === 'playing');

  const collapseLabel = collapsed ? t('expandMenu') : t('collapseMenu');

  return (
    <Box
      component="aside"
      sx={{
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100dvh',
        padding: collapsed ? 1.5 : 2,
        gap: 2,
        background: cssVars.sidebarBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: `1px solid ${cssVars.borderSubtle}`,
        zIndex: 6,
        overflow: 'hidden',
        transition:
          'width 240ms cubic-bezier(0.19, 1, 0.22, 1), padding 240ms cubic-bezier(0.19, 1, 0.22, 1)',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'space-between'}
        sx={{ paddingX: collapsed ? 0 : 1, paddingY: 1, minHeight: 40 }}
      >
        <Link
          href={appPath(locale)}
          aria-label={tBrand('name')}
          style={{ textDecoration: 'none', flexShrink: 0 }}
        >
          <BrandMark
            icon="monogram"
            label={tBrand('name')}
            showWordmark={!collapsed}
            size={collapsed ? 28 : 32}
          />
        </Link>
        {!collapsed ? (
          <Tooltip title={collapseLabel} placement="right" arrow>
            <IconButton
              size="small"
              aria-label={collapseLabel}
              aria-expanded
              onClick={onToggleCollapsed}
              sx={{
                flexShrink: 0,
                color: cssVars.textMuted,
                '&:hover': { color: cssVars.textPrimary, background: cssVars.hoverSubtle },
              }}
            >
              <PanelLeftClose size={18} aria-hidden />
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>

      {collapsed ? (
        <Tooltip title={collapseLabel} placement="right" arrow>
          <IconButton
            size="small"
            aria-label={collapseLabel}
            aria-expanded={false}
            onClick={onToggleCollapsed}
            sx={{
              alignSelf: 'center',
              color: cssVars.textMuted,
              '&:hover': { color: cssVars.textPrimary, background: cssVars.hoverSubtle },
            }}
          >
            <PanelLeftOpen size={18} aria-hidden />
          </IconButton>
        </Tooltip>
      ) : null}

      <Stack component="nav" spacing={0.5} aria-label="Primary">
        {navItems.map(({ href, labelKey, Icon }) => {
          const fullHref = appPath(locale, href);
          const isActive = isAppPathActive(locale, href, pathname);
          return (
            <Tooltip key={labelKey} title={t(labelKey)} placement="right" arrow>
              <Link href={fullHref} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : 1.5,
                    paddingX: collapsed ? 1 : 1.5,
                    paddingY: 1.25,
                    borderRadius: `${radii.md}px`,
                    color: isActive ? cssVars.textPrimary : cssVars.textMuted,
                    background: isActive ? cssVars.navActiveBg : 'transparent',
                    border: `1px solid ${isActive ? cssVars.borderStrong : 'transparent'}`,
                    transition: 'background-color 160ms, color 160ms, border-color 160ms',
                    '&:hover': {
                      background: cssVars.hoverSubtle,
                      color: cssVars.textPrimary,
                    },
                  }}
                >
                  <Icon size={18} aria-hidden />
                  {!collapsed ? (
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {t(labelKey)}
                    </Box>
                  ) : null}
                </Box>
              </Link>
            </Tooltip>
          );
        })}
      </Stack>

      <SidebarPlaylists collapsed={collapsed} />

      <Box sx={{ flex: 1 }} />

      {current ? (
        <Box
          sx={{
            px: collapsed ? 0 : 1,
            py: 1,
            borderTop: `1px solid ${cssVars.borderSubtle}`,
          }}
        >
          {collapsed ? (
            // Collapsed: just a pulsing dot
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isPlaying ? accent.cyan : cssVars.textMuted,
                mx: 'auto',
                ...(isPlaying
                  ? {
                      '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }
                  : {}),
              }}
            />
          ) : (
            <Link href={trackPath(current.slug)} style={{ textDecoration: 'none' }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  px: 0.5,
                  py: 0.75,
                  borderRadius: `${radii.sm}px`,
                  '&:hover': { background: cssVars.hoverSubtle },
                }}
              >
                {/* Equalizer bars animation */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '2px',
                    width: 18,
                    height: 18,
                    flexShrink: 0,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 4,
                        background: accent.cyan,
                        borderRadius: 1,
                        ...(isPlaying
                          ? {
                              '@keyframes eq': {
                                '0%,100%': { height: '30%' },
                                '50%': { height: '100%' },
                              },
                              animation: `eq ${0.8 + i * 0.15}s ease-in-out infinite`,
                              animationDelay: `${i * 0.1}s`,
                              height: '60%',
                            }
                          : { height: '30%' }),
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: cssVars.textPrimary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {current.title}
                  </Box>
                  <Box
                    sx={{
                      fontSize: '0.65rem',
                      color: cssVars.textMuted,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {current.artist}
                  </Box>
                </Box>
              </Stack>
            </Link>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
