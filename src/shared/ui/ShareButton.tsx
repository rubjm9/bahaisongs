'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Box, IconButton, Typography } from '@mui/material';
import { Share2 } from 'lucide-react';
import { accent, cssVars } from '@/shared/theme/tokens';
import { MOBILE_NAV_HEIGHT, MOBILE_PLAYER_HEIGHT } from './shellLayout';

function ShareSpeechBubble({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: { xs: 176, sm: 260 },
        minWidth: 0,
        pointerEvents: 'auto',
        filter: `drop-shadow(0 2px 10px ${accent.cyan}16)`,
      }}
    >
      <Typography
        component="p"
        sx={{
          m: 0,
          px: 1.5,
          py: 1,
          fontSize: { xs: '0.75rem', sm: '0.8125rem' },
          fontWeight: 500,
          lineHeight: 1.35,
          color: cssVars.textPrimary,
          bgcolor: cssVars.bgElevated,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRight: 'none',
          borderRadius: '10px 2px 2px 10px',
        }}
      >
        {children}
      </Typography>
      <Box
        aria-hidden
        sx={{
          width: 0,
          height: 0,
          flexShrink: 0,
          marginLeft: '-1px',
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft: '6px solid',
          borderLeftColor: cssVars.bgElevated,
        }}
      />
    </Box>
  );
}

/**
 * Floating share button. Uses the Web Share API when available (shows the
 * native OS sheet on mobile), and falls back to opening WhatsApp on desktop.
 */
export function ShareButton() {
  const t = useTranslations('share');
  const pathname = usePathname();
  const [pageUrl, setPageUrl] = useState('');
  const [feedback, setFeedback] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, [pathname]);

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const whatsappHref = useMemo(() => {
    if (!pageUrl || canNativeShare) return undefined;
    const params = new URLSearchParams({ text: pageUrl });
    return `https://wa.me/?${params.toString()}`;
  }, [pageUrl, canNativeShare]);

  const handleNativeShare = useCallback(async () => {
    if (!pageUrl) return;
    try {
      await navigator.share({ url: pageUrl, title: document.title });
    } catch {
      // user cancelled — silently ignore
    }
  }, [pageUrl]);

  const handleCopyFallback = useCallback(async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setFeedback(true);
      setTimeout(() => setFeedback(false), 2000);
    } catch {
      // ignore
    }
  }, [pageUrl]);

  if (!pageUrl) return null;

  return (
    <Box
      role="group"
      aria-label={t('ariaLabel')}
      sx={{
        position: 'fixed',
        right: { xs: 12, md: 20 },
        bottom: {
          xs: `calc(${MOBILE_NAV_HEIGHT} + ${MOBILE_PLAYER_HEIGHT} + 16px + env(safe-area-inset-bottom, 0px))`,
          md: 132,
        },
        zIndex: 7,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0.5,
        pointerEvents: 'none',
      }}
    >
      <ShareSpeechBubble>{feedback ? t('copied') : t('hint')}</ShareSpeechBubble>

      {canNativeShare ? (
        <IconButton
          onClick={handleNativeShare}
          aria-label={t('ariaLabel')}
          sx={{
            pointerEvents: 'auto',
            width: 52,
            height: 52,
            flexShrink: 0,
            color: '#fff',
            background: `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 100%)`,
            border: `1px solid ${accent.cyan}55`,
            boxShadow: `0 4px 20px ${accent.cyan}44, 0 0 0 1px ${cssVars.borderSubtle}`,
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            '&:hover': {
              boxShadow: `0 6px 28px ${accent.cyan}55`,
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Share2 size={20} />
        </IconButton>
      ) : whatsappHref ? (
        <IconButton
          component="a"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('ariaLabel')}
          sx={{
            pointerEvents: 'auto',
            width: 52,
            height: 52,
            flexShrink: 0,
            color: '#fff',
            background: `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 55%, #25D366 100%)`,
            border: `1px solid ${accent.cyan}55`,
            boxShadow: `0 4px 20px ${accent.cyan}44, 0 0 0 1px ${cssVars.borderSubtle}`,
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            '&:hover': {
              boxShadow: `0 6px 28px ${accent.cyan}55`,
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Share2 size={20} />
        </IconButton>
      ) : (
        <IconButton
          onClick={handleCopyFallback}
          aria-label={t('ariaLabel')}
          sx={{
            pointerEvents: 'auto',
            width: 52,
            height: 52,
            flexShrink: 0,
            color: '#fff',
            background: `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 100%)`,
            border: `1px solid ${accent.cyan}55`,
            boxShadow: `0 4px 20px ${accent.cyan}44, 0 0 0 1px ${cssVars.borderSubtle}`,
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            '&:hover': {
              boxShadow: `0 6px 28px ${accent.cyan}55`,
              transform: 'translateY(-2px)',
            },
          }}
        >
          <Share2 size={20} />
        </IconButton>
      )}
    </Box>
  );
}
