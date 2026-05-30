'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Stack,
  Box,
  Divider,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { X, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cssVars, radii } from '@/shared/theme/tokens';
import { authGoogleEnabled } from '@/shared/lib/supabase/auth-config';
import { useSignIn } from '../hooks/useSignIn';
import { useUser } from '../hooks/useUser';

interface Props {
  open: boolean;
  onClose: () => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginModal({ open, onClose }: Props) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { signInWithGoogle, signInWithMagicLink, loading, error, clearError } = useSignIn();
  const { user } = useUser();

  useEffect(() => {
    if (user && open) onClose();
  }, [user, open, onClose]);

  async function handleMagicLink() {
    if (!email) return;
    const ok = await signInWithMagicLink(email);
    if (ok) setSent(true);
  }

  function handleClose() {
    setSent(false);
    setEmail('');
    clearError();
    onClose();
  }

  function renderError() {
    if (!error) return null;
    const message =
      error === 'provider_disabled' ? t('errorProviderDisabled') : error;
    return (
      <Typography sx={{ color: 'var(--bs-status-error)', fontSize: '0.8rem' }}>
        {message}
      </Typography>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background: cssVars.bgElevated,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: `${radii.lg}px`,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          pb: 0,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: cssVars.textPrimary }}>
            {t('modalTitle')}
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: '0.875rem', color: cssVars.textMuted, lineHeight: 1.5 }}>
            {t('modalSubtitle')}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} aria-label="close" sx={{ mt: -0.5 }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {sent ? (
          <Stack spacing={1} sx={{ textAlign: 'center', py: 3 }}>
            <Typography sx={{ color: cssVars.textPrimary, fontSize: '1rem', fontWeight: 600 }}>
              {t('magicLinkSentTitle')}
            </Typography>
            <Typography sx={{ color: cssVars.textMuted, fontSize: '0.875rem', lineHeight: 1.5 }}>
              {t('magicLinkSentBody')}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField
              label={t('emailLabel')}
              placeholder={t('magicLinkPlaceholder')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
              fullWidth
              size="small"
              disabled={loading}
              InputProps={{
                startAdornment: <Mail size={16} style={{ marginRight: 8, opacity: 0.6 }} />,
              }}
            />

            <Button
              variant="contained"
              onClick={handleMagicLink}
              disabled={loading || !email}
              fullWidth
              sx={{
                background: cssVars.accentElectric,
                color: cssVars.textInverse,
                fontWeight: 600,
                borderRadius: `${radii.md}px`,
                '&:hover': { background: cssVars.accentCyan },
              }}
            >
              {loading ? <CircularProgress size={18} /> : t('sendAccessLink')}
            </Button>

            {renderError()}

            {authGoogleEnabled ? (
              <>
                <Divider sx={{ my: 0.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: cssVars.textMuted }}>
                    {t('orContinueWith')}
                  </Typography>
                </Divider>

                <Button
                  variant="outlined"
                  onClick={() => void signInWithGoogle()}
                  disabled={loading}
                  fullWidth
                  startIcon={<GoogleIcon />}
                  sx={{
                    borderColor: cssVars.borderSubtle,
                    color: cssVars.textPrimary,
                    borderRadius: `${radii.md}px`,
                    '&:hover': { borderColor: cssVars.borderStrong, background: cssVars.hoverSubtle },
                  }}
                >
                  {t('continueWithGoogle')}
                </Button>
              </>
            ) : (
              <Typography sx={{ fontSize: '0.8rem', color: cssVars.textMuted, textAlign: 'center', pt: 0.5 }}>
                {t('googleSetupHint')}
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
