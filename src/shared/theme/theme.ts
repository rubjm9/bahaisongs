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

export function createBsTheme(mode: ThemeMode) {
  const semantic = getSemanticPalette(mode);
  const shadows = getShadows(mode);

  return createTheme({
    cssVariables: true,
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
      fontFamily: typography.fontFamily.body,
      h1: {
        fontFamily: typography.fontFamily.display,
        fontWeight: typography.weight.bold,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: typography.fontFamily.display,
        fontWeight: typography.weight.bold,
        letterSpacing: '-0.015em',
      },
      h3: {
        fontFamily: typography.fontFamily.display,
        fontWeight: typography.weight.semibold,
        letterSpacing: '-0.01em',
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
    },
  });
}

/** Default dark theme for any static imports during migration. */
export const muiTheme = createBsTheme('dark');

export default muiTheme;
