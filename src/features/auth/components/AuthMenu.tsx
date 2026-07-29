'use client';

import { useEffect, useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import { LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GlowButton } from '@/shared/ui/GlowButton';
import { cssVars } from '@/shared/theme/tokens';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { useUser } from '../hooks/useUser';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { UserAvatar } from './UserAvatar';
import { LoginModal } from './LoginModal';

function hasSafeNextParam(): boolean {
  if (typeof window === 'undefined') return false;
  const next = new URLSearchParams(window.location.search).get('next');
  return Boolean(next?.startsWith('/') && !next.startsWith('//'));
}

export function AuthMenu() {
  const t = useTranslations('auth');
  const [loginOpen, setLoginOpen] = useState(false);
  const { isOpen: promptOpen, open: openPrompt, close: closePrompt } = useLoginPrompt();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!supabaseEnabled || loading || user) return;
    if (hasSafeNextParam()) openPrompt();
  }, [loading, user, openPrompt]);

  const isOpen = loginOpen || promptOpen;
  const handleClose = () => {
    setLoginOpen(false);
    closePrompt();
  };

  if (!supabaseEnabled) {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <GlowButton tone="glass" disabled startIcon={<LogIn size={16} />} sx={{ height: 40 }}>
          <Box component="span" sx={{ color: cssVars.textMuted }}>
            {t('signIn')}
          </Box>
        </GlowButton>
      </Box>
    );
  }

  return (
    <>
      <AuthMenuInner onOpenLogin={() => setLoginOpen(true)} />
      <LoginModal open={isOpen} onClose={handleClose} />
    </>
  );
}

function AuthMenuInner({ onOpenLogin }: { onOpenLogin: () => void }) {
  const t = useTranslations('auth');
  const { user, profile, loading } = useUser();

  if (loading) {
    return <Skeleton variant="circular" width={36} height={36} />;
  }

  if (user) {
    return <UserAvatar profile={profile} />;
  }

  return (
    <GlowButton
      tone="glass"
      startIcon={<LogIn size={16} />}
      sx={{ height: 40 }}
      onClick={onOpenLogin}
    >
      {t('signIn')}
    </GlowButton>
  );
}
