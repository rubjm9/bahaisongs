'use client';

import { useState, type MouseEvent } from 'react';
import { useLocale } from 'next-intl';
import { IconButton, Menu, MenuItem, ListItemText } from '@mui/material';
import { Languages } from 'lucide-react';
import { localeLabels, locales, type Locale } from '@/shared/lib/i18n/config';
import { usePathname, useRouter } from '@/shared/lib/i18n/routing';
import { cssVars } from '@/shared/theme/tokens';

export function LocaleSwitcher() {
  const current = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget);
  const handleClose = () => setAnchor(null);

  const switchTo = (next: Locale) => {
    handleClose();
    if (next === current) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-label="Change language"
        sx={{
          color: cssVars.textPrimary,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: 999,
          width: 40,
          height: 40,
          '&:hover': { background: cssVars.hoverSubtle },
        }}
      >
        <Languages size={18} />
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
        {locales.map((l) => (
          <MenuItem key={l} selected={l === current} onClick={() => switchTo(l)}>
            <ListItemText
              primary={localeLabels[l]}
              secondary={l.toUpperCase()}
              slotProps={{
                primary: { sx: { color: cssVars.textPrimary, fontWeight: 500 } },
                secondary: { sx: { color: cssVars.textMuted, fontSize: '0.7rem' } },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
