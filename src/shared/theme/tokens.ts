/**
 * Single source of truth for visual design.
 * Accent tokens are fixed (decorative / brand). Semantic tokens vary by theme mode.
 */

/** Fixed brand accents — unchanged in light and dark mode. */
export const accent = {
  electric: '#1E90FF',
  cyan: '#4FD1FF',
  glow: '#6EA8FE',
  indigo: '#6366F1',
} as const;

/** Extended palette for decorative placeholders — do not use for text or interactive states. */
export const accentExtended = {
  magenta: '#EC4899',
  teal: '#0D9488',
  amber: '#F59E0B',
  violet: '#8B5CF6',
} as const;

export type ThemeMode = 'light' | 'dark';

export interface SemanticPalette {
  readonly bg: {
    readonly primary: string;
    readonly elevated: string;
    readonly glass: string;
  };
  readonly text: {
    readonly primary: string;
    readonly muted: string;
    readonly inverse: string;
  };
  readonly border: {
    readonly subtle: string;
    readonly strong: string;
  };
  readonly status: {
    readonly success: string;
    readonly warning: string;
    readonly error: string;
  };
}

export const semanticDark = {
  bg: {
    primary: '#050B1A',
    elevated: '#0B1A33',
    glass: 'rgba(13, 37, 64, 0.55)',
  },
  text: {
    primary: '#E6F0FF',
    muted: '#8AA1C4',
    inverse: '#050B1A',
  },
  border: {
    subtle: 'rgba(110, 168, 254, 0.12)',
    strong: 'rgba(110, 168, 254, 0.24)',
  },
  status: {
    success: '#34D399',
    warning: '#F59E0B',
    error: '#F87171',
  },
} as const satisfies SemanticPalette;

export const semanticLight = {
  bg: {
    primary: '#F0F4FA',
    elevated: '#FFFFFF',
    glass: 'rgba(255, 255, 255, 0.72)',
  },
  text: {
    primary: '#0D1F3C',
    muted: '#5A7399',
    inverse: '#FFFFFF',
  },
  border: {
    subtle: 'rgba(30, 144, 255, 0.14)',
    strong: 'rgba(30, 144, 255, 0.26)',
  },
  status: {
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
  },
} as const satisfies SemanticPalette;

export function getSemanticPalette(mode: ThemeMode): SemanticPalette {
  return mode === 'light' ? semanticLight : semanticDark;
}

export interface Gradients {
  readonly aurora: string;
  readonly glow: string;
  readonly spiritual: string;
  readonly topBarFade: string;
}

const gradientsDark = {
  aurora:
    'linear-gradient(135deg, rgba(99,102,241,0.55) 0%, rgba(30,144,255,0.45) 45%, rgba(79,209,255,0.35) 100%)',
  glow: 'radial-gradient(circle at 50% 0%, rgba(79,209,255,0.30) 0%, transparent 60%)',
  spiritual:
    'linear-gradient(180deg, rgba(5,11,26,1) 0%, rgba(11,26,51,0.85) 60%, rgba(5,11,26,1) 100%)',
  topBarFade:
    'linear-gradient(180deg, rgba(5,11,26,0.85) 0%, rgba(5,11,26,0.55) 70%, rgba(5,11,26,0) 100%)',
} as const satisfies Gradients;

const gradientsLight = {
  aurora:
    'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(30,144,255,0.18) 45%, rgba(79,209,255,0.14) 100%)',
  glow: 'radial-gradient(circle at 50% 0%, rgba(79,209,255,0.15) 0%, transparent 60%)',
  spiritual:
    'linear-gradient(180deg, rgba(240,244,250,1) 0%, rgba(255,255,255,0.9) 60%, rgba(240,244,250,1) 100%)',
  topBarFade:
    'linear-gradient(180deg, rgba(240,244,250,0.92) 0%, rgba(240,244,250,0.65) 70%, rgba(240,244,250,0) 100%)',
} as const satisfies Gradients;

export function getGradients(mode: ThemeMode): Gradients {
  return mode === 'light' ? gradientsLight : gradientsDark;
}

export interface Shadows {
  readonly card: string;
  readonly glow: string;
  readonly glowStrong: string;
}

const shadowsDark = {
  card: '0 8px 32px rgba(0, 0, 0, 0.32)',
  glow: '0 0 24px rgba(79, 209, 255, 0.18)',
  glowStrong: '0 0 48px rgba(79, 209, 255, 0.32)',
} as const satisfies Shadows;

const shadowsLight = {
  card: '0 8px 32px rgba(15, 40, 80, 0.08)',
  glow: '0 0 24px rgba(79, 209, 255, 0.14)',
  glowStrong: '0 0 48px rgba(79, 209, 255, 0.22)',
} as const satisfies Shadows;

export function getShadows(mode: ThemeMode): Shadows {
  return mode === 'light' ? shadowsLight : shadowsDark;
}

/** CSS custom property names for theme-aware styling (SSR-safe in sx). */
export const cssVars = {
  bgPrimary: 'var(--bs-bg-primary)',
  bgElevated: 'var(--bs-bg-elevated)',
  bgGlass: 'var(--bs-bg-glass)',
  textPrimary: 'var(--bs-text-primary)',
  textMuted: 'var(--bs-text-muted)',
  textInverse: 'var(--bs-text-inverse)',
  borderSubtle: 'var(--bs-border-subtle)',
  borderStrong: 'var(--bs-border-strong)',
  topBarFade: 'var(--bs-topbar-fade)',
  accentElectric: 'var(--bs-accent-electric)',
  accentCyan: 'var(--bs-accent-cyan)',
  accentGlow: 'var(--bs-accent-glow)',
  accentIndigo: 'var(--bs-accent-indigo)',
  hoverSubtle: 'var(--bs-hover-subtle)',
  selectionBg: 'var(--bs-selection-bg)',
  selectionFg: 'var(--bs-selection-fg)',
  sidebarBg: 'var(--bs-sidebar-bg)',
  navActiveBg: 'var(--bs-nav-active-bg)',
  shadowCard: 'var(--bs-shadow-card)',
  shadowGlow: 'var(--bs-shadow-glow)',
  shadowGlowStrong: 'var(--bs-shadow-glow-strong)',
  lyricsFade: 'var(--bs-lyrics-fade)',
  popoverBg: 'var(--bs-popover-bg)',
  popoverShadow: 'var(--bs-popover-shadow)',
  focusRing: 'var(--bs-focus-ring)',
} as const;

/** @deprecated Use cssVars or useBsTheme().semantic — kept for gradual migration. */
export const palette = {
  bg: semanticDark.bg,
  accent,
  text: semanticDark.text,
  border: semanticDark.border,
  status: semanticDark.status,
} as const;

/** @deprecated Use getGradients(mode) */
export const gradients = gradientsDark;

/** @deprecated Use getShadows(mode) */
export const shadows = shadowsDark;

export const typography = {
  fontFamily: {
    body: "var(--bs-font-sans), 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    display: "var(--bs-font-display), 'Outfit', system-ui, sans-serif",
    heading: "var(--bs-font-display), 'Outfit', system-ui, sans-serif",
    lyrics: "var(--bs-font-sans), 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    /** Prefer Noto Sans Arabic when the CSS variable is set (RTL locales). */
    rtl: "var(--bs-font-arabic), var(--bs-font-sans), 'Noto Sans Arabic', system-ui, sans-serif",
    cjk: "var(--bs-font-cjk), var(--bs-font-sans), 'Noto Sans SC', system-ui, sans-serif",
    devanagari:
      "var(--bs-font-devanagari), var(--bs-font-sans), 'Noto Sans Devanagari', system-ui, sans-serif",
  },
  weight: { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

export const radii = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 } as const;

export const blur = { sm: '8px', md: '16px', lg: '24px' } as const;

export const motion = {
  duration: { fast: 160, base: 240, slow: 420 },
  easing: {
    easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
    easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
} as const;

/** Spacing scale in pixels — 4px base. */
export const spacing = (n: number): number => n * 4;

/** Theme color meta tag values per resolved mode. */
export const themeColorMeta = {
  dark: '#050B1A',
  light: '#F0F4FA',
} as const;
