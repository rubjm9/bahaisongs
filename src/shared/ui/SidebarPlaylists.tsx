'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { ListMusic, Plus } from 'lucide-react';
import { useUser } from '@/features/auth/hooks/useUser';
import { usePlaylists } from '@/features/playlists/hooks/usePlaylists';
import { CreatePlaylistModal } from '@/features/playlists/components/CreatePlaylistModal';
import { cssVars, radii, accent } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';

const MAX_VISIBLE = 8;

interface Props {
  collapsed: boolean;
}

export function SidebarPlaylists({ collapsed }: Props) {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const pathname = usePathname() ?? appPath(locale);
  const { user, loading: userLoading } = useUser();
  const { playlists, loading: playlistsLoading } = usePlaylists();
  const [createOpen, setCreateOpen] = useState(false);

  if (collapsed) return null;

  const libraryHref = appPath(locale, 'library');
  const loading = userLoading || (!!user && playlistsLoading);
  const visiblePlaylists = playlists.slice(0, MAX_VISIBLE);
  const hasMore = playlists.length > MAX_VISIBLE;

  const rowSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    paddingX: 1.5,
    paddingY: 0.875,
    borderRadius: `${radii.md}px`,
    color: cssVars.textMuted,
    border: '1px solid transparent',
    transition: 'background-color 160ms, color 160ms, border-color 160ms',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
    background: 'transparent',
    font: 'inherit',
    '&:hover': {
      background: cssVars.hoverSubtle,
      color: cssVars.textPrimary,
    },
  };

  function playlistRowActive(slug: string): boolean {
    const href = appPath(locale, `playlist/${slug}`);
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <Box
      component="section"
      aria-labelledby="sidebar-playlists-heading"
      sx={{
        mt: 1,
        pt: 1.5,
        borderTop: `1px solid ${cssVars.borderSubtle}`,
      }}
    >
      <Typography
        id="sidebar-playlists-heading"
        sx={{
          px: 1.5,
          mb: 0.75,
          color: cssVars.textMuted,
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {t('yourPlaylists')}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
          <CircularProgress size={18} sx={{ color: cssVars.textMuted }} />
        </Box>
      ) : !user ? (
        <Link href={libraryHref} style={{ textDecoration: 'none' }}>
          <Box component="span" sx={rowSx}>
            <Plus size={16} aria-hidden style={{ flexShrink: 0 }} />
            <Box
              component="span"
              sx={{
                fontSize: '0.82rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t('createPlaylist')}
            </Box>
          </Box>
        </Link>
      ) : playlists.length === 0 ? (
        <>
          <Box
            component="button"
            type="button"
            onClick={() => setCreateOpen(true)}
            sx={rowSx}
          >
            <Plus size={16} aria-hidden style={{ flexShrink: 0 }} />
            <Box
              component="span"
              sx={{
                fontSize: '0.82rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {t('createPlaylist')}
            </Box>
          </Box>
          <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </>
      ) : (
        <Stack
          spacing={0.25}
          sx={{
            maxHeight: 220,
            overflowY: 'auto',
            pr: 0.25,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': {
              background: cssVars.borderSubtle,
              borderRadius: 4,
            },
          }}
        >
          {visiblePlaylists.map((pl) => {
            const href = appPath(locale, `playlist/${pl.slug}`);
            const isActive = playlistRowActive(pl.slug);
            return (
              <Link key={pl.id} href={href} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    ...rowSx,
                    color: isActive ? cssVars.textPrimary : cssVars.textMuted,
                    background: isActive ? cssVars.navActiveBg : 'transparent',
                    border: `1px solid ${isActive ? cssVars.borderStrong : 'transparent'}`,
                  }}
                >
                  <ListMusic size={15} aria-hidden style={{ flexShrink: 0, opacity: 0.85 }} />
                  <Box
                    component="span"
                    sx={{
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {pl.title}
                  </Box>
                </Box>
              </Link>
            );
          })}
          {hasMore ? (
            <Link href={appPath(locale, 'playlists')} style={{ textDecoration: 'none' }}>
              <Typography
                sx={{
                  px: 1.5,
                  py: 0.75,
                  fontSize: '0.75rem',
                  color: accent.cyan,
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {t('viewAllPlaylists')}
              </Typography>
            </Link>
          ) : null}
          <Box
            component="button"
            type="button"
            onClick={() => setCreateOpen(true)}
            sx={{
              ...rowSx,
              mt: 0.25,
              color: accent.cyan,
              '&:hover': { color: accent.cyan, background: cssVars.hoverSubtle },
            }}
          >
            <Plus size={15} aria-hidden style={{ flexShrink: 0 }} />
            <Box component="span" sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
              {t('createPlaylist')}
            </Box>
          </Box>
          <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </Stack>
      )}
    </Box>
  );
}
