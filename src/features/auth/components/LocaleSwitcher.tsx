'use client';

import { useState, type MouseEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { Languages } from 'lucide-react';
import { localeLabels, locales, type Locale } from '@/shared/lib/i18n/config';
import { usePathname, useRouter } from '@/shared/lib/i18n/routing';
import { cssVars } from '@/shared/theme/tokens';

export function LocaleSwitcher() {
  const current = useLocale() as Locale;
  const t = useTranslations('settings');
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
        aria-label={t('languageAria')}
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
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              background: cssVars.bgElevated,
              border: `1px solid ${cssVars.borderSubtle}`,
              direction: 'ltr',
              minWidth: 168,
            },
          },
        }}
      >
        {locales.map((l) => (
          <MenuItem
            key={l}
            selected={l === current}
            onClick={() => switchTo(l)}
            dense
            sx={{
              py: 0.75,
              gap: 1.25,
              minHeight: 36,
              justifyContent: 'space-between',
            }}
          >
            <Typography
              component="span"
              sx={{
                color: cssVars.textPrimary,
                fontWeight: 500,
                fontSize: '0.875rem',
                lineHeight: 1.25,
                textAlign: 'start',
                unicodeBidi: 'plaintext',
              }}
            >
              {localeLabels[l]}
            </Typography>
            <Box
              component="span"
              sx={{
                color: cssVars.textMuted,
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {l}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
