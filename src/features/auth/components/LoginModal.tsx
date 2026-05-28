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
import { X, Mail, Chrome } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cssVars, radii } from '@/shared/theme/tokens';
import { useSignIn } from '../hooks/useSignIn';
import { useUser } from '../hooks/useUser';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: Props) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { signInWithGoogle, signInWithMagicLink, loading, error } = useSignIn();
  const { user } = useUser();

  useEffect(() => {
    if (user && open) onClose();
  }, [user, open, onClose]);

  async function handleMagicLink() {
    if (!email) return;
    await signInWithMagicLink(email);
    if (!error) setSent(true);
  }

  function handleClose() {
    setSent(false);
    setEmail('');
    onClose();
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
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: cssVars.textPrimary }}>
          {t('signIn')}
        </Typography>
        <IconButton size="small" onClick={handleClose} aria-label="close">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {sent ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 3,
              color: cssVars.textPrimary,
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            {t('magicLinkSent')}
          </Box>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('magicLink')}
              placeholder={t('magicLinkPlaceholder')}
              type="email"
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
              {loading ? <CircularProgress size={18} /> : t('magicLink')}
            </Button>

            {error ? (
              <Typography sx={{ color: 'var(--bs-status-error)', fontSize: '0.8rem' }}>
                {error}
              </Typography>
            ) : null}

            <Divider sx={{ my: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', color: cssVars.textMuted }}>
                {t('orContinueWith')}
              </Typography>
            </Divider>

            <Button
              variant="outlined"
              onClick={signInWithGoogle}
              disabled={loading}
              fullWidth
              startIcon={<Chrome size={16} />}
              sx={{
                borderColor: cssVars.borderSubtle,
                color: cssVars.textPrimary,
                borderRadius: `${radii.md}px`,
                '&:hover': { borderColor: cssVars.borderStrong, background: cssVars.hoverSubtle },
              }}
            >
              Google
            </Button>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
