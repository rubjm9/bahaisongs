'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Box, IconButton, Typography } from '@mui/material';
import { accent, cssVars } from '@/shared/theme/tokens';
import { MOBILE_WHATSAPP_BOTTOM } from '@/shared/ui/shellLayout';

function WhatsAppIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Speech bubble with a small fixed-size tail (does not stretch with text width). */
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
          borderLeft: `6px solid`,
          borderLeftColor: cssVars.bgElevated,
        }}
      />
    </Box>
  );
}

/**
 * Floating WhatsApp share control — shares the current page URL.
 * Styled with BahaiSongs accent tokens; the icon is recognisable, not default green chrome.
 */
export function WhatsAppShareButton() {
  const t = useTranslations('share');
  const pathname = usePathname();
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    setPageUrl(window.location.href);
  }, [pathname]);

  const whatsappHref = useMemo(() => {
    if (!pageUrl) return undefined;
    const params = new URLSearchParams({ text: pageUrl });
    return `https://wa.me/?${params.toString()}`;
  }, [pageUrl]);

  if (!whatsappHref) return null;

  return (
    <Box
      role="group"
      aria-label={t('ariaLabel')}
      sx={{
        position: 'fixed',
        right: { xs: 12, md: 20 },
        bottom: { xs: MOBILE_WHATSAPP_BOTTOM, md: 132 },
        zIndex: 7,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0.5,
        pointerEvents: 'none',
      }}
    >
      <ShareSpeechBubble>{t('hint')}</ShareSpeechBubble>

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
            background: `linear-gradient(135deg, ${accent.cyan} 0%, ${accent.electric} 40%, #25D366 100%)`,
            boxShadow: `0 6px 28px ${accent.cyan}55`,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <WhatsAppIcon />
      </IconButton>
    </Box>
  );
}
