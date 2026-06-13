'use client';

import { useState } from 'react';
import { Box, IconButton, Paper, Slide, Stack, Typography, Button } from '@mui/material';
import { Download, Share, SquarePlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BrandMark } from '@/shared/ui/BrandMark';
import { cssVars } from '@/shared/theme/tokens';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

/**
 * Non-intrusive install banner anchored to the bottom of the viewport.
 * On Android/Chromium it triggers the native install prompt; on iOS Safari
 * it expands manual "Add to Home Screen" instructions.
 */
export function InstallPrompt() {
  const t = useTranslations('pwa.install');
  const { canShow, isIos, install, dismiss } = useInstallPrompt();
  const [showIosSteps, setShowIosSteps] = useState(false);

  if (!canShow) return null;

  return (
    <Slide in direction="up" mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        role="dialog"
        aria-label={t('title')}
        sx={{
          position: 'fixed',
          left: { xs: 12, sm: 'auto' },
          right: { xs: 12, sm: 24 },
          bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 76px)', sm: 24 },
          zIndex: (theme) => theme.zIndex.snackbar,
          maxWidth: 380,
          p: 2,
          borderRadius: 3,
          background: cssVars.popoverBg,
          border: `1px solid ${cssVars.borderStrong}`,
          boxShadow: cssVars.shadowGlow,
          backdropFilter: 'blur(12px)',
        }}
      >
        <IconButton
          size="small"
          aria-label={t('dismiss')}
          onClick={dismiss}
          sx={{ position: 'absolute', top: 6, right: 6, color: cssVars.textMuted }}
        >
          <X size={16} />
        </IconButton>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', pr: 3 }}>
          <BrandMark size={36} showWordmark={false} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: cssVars.textPrimary, lineHeight: 1.2 }}>
              {t('title')}
            </Typography>
            <Typography variant="body2" sx={{ color: cssVars.textMuted }}>
              {t('description')}
            </Typography>
          </Box>
        </Stack>

        {isIos ? (
          <Box sx={{ mt: 1.5 }}>
            {showIosSteps ? (
              <Stack spacing={1} sx={{ color: cssVars.textMuted }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Share size={18} aria-hidden />
                  <Typography variant="body2">{t('iosStep1')}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <SquarePlus size={18} aria-hidden />
                  <Typography variant="body2">{t('iosStep2')}</Typography>
                </Stack>
              </Stack>
            ) : (
              <Button
                fullWidth
                variant="contained"
                startIcon={<Share size={16} />}
                onClick={() => setShowIosSteps(true)}
                sx={{ borderRadius: 999, textTransform: 'none' }}
              >
                {t('iosCta')}
              </Button>
            )}
          </Box>
        ) : (
          <Button
            fullWidth
            variant="contained"
            startIcon={<Download size={16} />}
            onClick={() => {
              void install();
            }}
            sx={{ mt: 1.5, borderRadius: 999, textTransform: 'none' }}
          >
            {t('cta')}
          </Button>
        )}
      </Paper>
    </Slide>
  );
}
