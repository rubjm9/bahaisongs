'use client';

import { createTheme } from '@mui/material/styles';
import {
  accent,
  getSemanticPalette,
  getShadows,
  radii,
  typography,
  type ThemeMode,
} from './tokens';

export function createBsTheme(mode: ThemeMode, direction: 'ltr' | 'rtl' = 'ltr') {
  const semantic = getSemanticPalette(mode);
  const shadows = getShadows(mode);
  const isRtl = direction === 'rtl';
  const bodyFont = isRtl ? typography.fontFamily.rtl : typography.fontFamily.body;
  const displayFont = isRtl ? typography.fontFamily.rtl : typography.fontFamily.display;

  return createTheme({
    cssVariables: true,
    direction,
    palette: {
      mode,
      primary: { main: accent.electric, light: accent.glow },
      secondary: { main: accent.cyan },
      background: { default: semantic.bg.primary, paper: semantic.bg.elevated },
      text: { primary: semantic.text.primary, secondary: semantic.text.muted },
      divider: semantic.border.subtle,
      error: { main: semantic.status.error },
      warning: { main: semantic.status.warning },
      success: { main: semantic.status.success },
    },
    shape: { borderRadius: radii.md },
    typography: {
      fontFamily: bodyFont,
      h1: {
        fontFamily: displayFont,
        fontWeight: typography.weight.bold,
        letterSpacing: isRtl ? '0' : '-0.02em',
      },
      h2: {
        fontFamily: displayFont,
        fontWeight: typography.weight.bold,
        letterSpacing: isRtl ? '0' : '-0.015em',
      },
      h3: {
        fontFamily: displayFont,
        fontWeight: typography.weight.semibold,
        letterSpacing: isRtl ? '0' : '-0.01em',
      },
      button: { textTransform: 'none', fontWeight: typography.weight.medium },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: radii.pill,
            boxShadow: 'none',
            '&:hover': { boxShadow: shadows.glow },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      // El reset global `*::before { box-sizing: border-box }` despega la
      // flecha del cuerpo del tooltip; content-box restaura el solape de MUI.
      MuiTooltip: {
        styleOverrides: {
          arrow: {
            '&::before': {
              boxSizing: 'content-box',
            },
          },
        },
      },
    },
  });
}

/** Default dark theme for any static imports during migration. */
export const muiTheme = createBsTheme('dark');

export default muiTheme;
