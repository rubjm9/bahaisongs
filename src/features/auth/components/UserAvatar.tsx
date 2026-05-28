'use client';

import { useState } from 'react';
import React from 'react';
import { Avatar, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { ListMusic, Heart, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { cssVars, radii } from '@/shared/theme/tokens';
import { useSignIn } from '../hooks/useSignIn';
import type { Profile } from '@/entities/user';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';

interface Props {
  profile: Profile | null;
}

export function UserAvatar({ profile }: Props) {
  const t = useTranslations('auth');
  const locale = useLocale() as Locale;
  const { signOut } = useSignIn();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const initial = profile?.displayName?.[0]?.toUpperCase() ?? '?';
  const avatarSrc = profile?.avatarPath;

  return (
    <>
      <Avatar
        {...(avatarSrc ? { src: avatarSrc } : {})}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => setAnchor(e.currentTarget)}
        sx={{
          width: 36,
          height: 36,
          cursor: 'pointer',
          background: cssVars.accentElectric,
          color: cssVars.textInverse,
          fontSize: '0.9rem',
          fontWeight: 700,
          border: `2px solid ${cssVars.borderStrong}`,
          '&:hover': { borderColor: cssVars.accentCyan },
          transition: 'border-color 160ms',
        }}
      >
        {!avatarSrc ? initial : null}
      </Avatar>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        PaperProps={{
          sx: {
            background: cssVars.bgElevated,
            border: `1px solid ${cssVars.borderSubtle}`,
            borderRadius: `${radii.md}px`,
            minWidth: 180,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          component={Link}
          href={appPath(locale, 'library')}
          onClick={() => setAnchor(null)}
          sx={{ color: cssVars.textPrimary, fontSize: '0.9rem' }}
        >
          <ListItemIcon sx={{ color: cssVars.textMuted, minWidth: 32 }}>
            <ListMusic size={16} />
          </ListItemIcon>
          <ListItemText>{t('myPlaylists')}</ListItemText>
        </MenuItem>

        <MenuItem
          component={Link}
          href={appPath(locale, 'favorites')}
          onClick={() => setAnchor(null)}
          sx={{ color: cssVars.textPrimary, fontSize: '0.9rem' }}
        >
          <ListItemIcon sx={{ color: cssVars.textMuted, minWidth: 32 }}>
            <Heart size={16} />
          </ListItemIcon>
          <ListItemText>{t('favorites')}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={async () => {
            setAnchor(null);
            await signOut();
          }}
          sx={{ color: cssVars.textPrimary, fontSize: '0.9rem' }}
        >
          <ListItemIcon sx={{ color: cssVars.textMuted, minWidth: 32 }}>
            <LogOut size={16} />
          </ListItemIcon>
          <ListItemText>{t('signOut')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
