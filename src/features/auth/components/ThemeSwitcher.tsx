'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Monitor, Sun, Moon } from 'lucide-react';
import { cssVars } from '@/shared/theme/tokens';
import {
  isThemePreference,
  themePreferenceCookie,
  type ThemePreference,
} from '@/shared/theme/themeStorage';

const options: { value: ThemePreference; icon: typeof Monitor }[] = [
  { value: 'system', icon: Monitor },
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
];

export function ThemeSwitcher() {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = (theme ?? 'system') as ThemePreference;
  const ActiveIcon = mounted
    ? (options.find((o) => o.value === current)?.icon ?? Monitor)
    : Monitor;

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget);
  const handleClose = () => setAnchor(null);

  const select = (value: ThemePreference) => {
    setTheme(value);
    if (isThemePreference(value)) {
      document.cookie = themePreferenceCookie(value);
    }
    handleClose();
  };

  const labelFor = (value: ThemePreference) => {
    if (value === 'system') return t('themeSystem');
    if (value === 'light') return t('themeLight');
    return t('themeDark');
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-label={t('themeAria')}
        sx={{
          color: cssVars.textPrimary,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: 999,
          width: 40,
          height: 40,
          '&:hover': { background: cssVars.hoverSubtle },
        }}
      >
        <ActiveIcon size={18} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              background: cssVars.bgGlass,
              backdropFilter: 'blur(16px)',
              border: `1px solid ${cssVars.borderSubtle}`,
            },
          },
        }}
      >
        {options.map(({ value, icon: Icon }) => (
          <MenuItem key={value} selected={current === value} onClick={() => select(value)}>
            <ListItemIcon sx={{ minWidth: 36, color: cssVars.accentCyan }}>
              <Icon size={18} />
            </ListItemIcon>
            <ListItemText
              primary={labelFor(value)}
              slotProps={{
                primary: { sx: { color: cssVars.textPrimary, fontWeight: 500 } },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
