'use client';

import { useEffect, useState } from 'react';
import { Button, IconButton, Paper, Slide, Stack, Typography } from '@mui/material';
import { X } from 'lucide-react';
import {
  ANALYTICS_CONSENT_EVENT,
  hasAcknowledgedAnalyticsNotice,
  writeAnalyticsConsent,
} from '@/shared/lib/analytics/consent';
import { isGoogleAnalyticsEnabled } from '@/shared/lib/analytics/gtag';
import { cssVars, radii } from '@/shared/theme/tokens';

/**
 * Notice that analytics cookies are used by default (tacit acceptance).
 * Accept or close dismisses the banner; tracking continues either way.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled()) return;
    setVisible(!hasAcknowledgedAnalyticsNotice());
  }, []);

  useEffect(() => {
    const onChange = () => setVisible(false);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onChange);
  }, []);

  function dismiss() {
    writeAnalyticsConsent('granted');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <Slide in direction="left" mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        role="dialog"
        aria-label="Aviso de cookies"
        sx={{
          position: 'fixed',
          right: { xs: 12, sm: 24 },
          left: 'auto',
          bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', sm: 24 },
          zIndex: (theme) => theme.zIndex.snackbar + 1,
          width: { xs: 'calc(100% - 24px)', sm: 380 },
          maxWidth: 380,
          p: 2,
          borderRadius: `${radii.lg}px`,
          background: cssVars.popoverBg,
          border: `1px solid ${cssVars.borderStrong}`,
          boxShadow: cssVars.shadowGlow,
          backdropFilter: 'blur(12px)',
        }}
      >
        <IconButton
          size="small"
          aria-label="Cerrar"
          onClick={dismiss}
          sx={{ position: 'absolute', top: 6, right: 6, color: cssVars.textMuted }}
        >
          <X size={16} />
        </IconButton>

        <Stack spacing={1.5} sx={{ pr: 3 }}>
          <Typography sx={{ fontWeight: 700, color: cssVars.textPrimary, lineHeight: 1.3 }}>
            Cookies de analítica
          </Typography>
          <Typography variant="body2" sx={{ color: cssVars.textMuted, lineHeight: 1.55 }}>
            Usamos Google Analytics para entender el uso de la plataforma. Al continuar
            navegando, aceptas estas cookies.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={dismiss}
            sx={{
              alignSelf: 'flex-start',
              background: cssVars.accentElectric,
              color: cssVars.textInverse,
              fontWeight: 600,
              borderRadius: `${radii.md}px`,
              textTransform: 'none',
              '&:hover': { background: cssVars.accentCyan },
            }}
          >
            Aceptar
          </Button>
        </Stack>
      </Paper>
    </Slide>
  );
}
