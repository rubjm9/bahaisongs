# Design system

Status: Phase 1+ — dual theme (light / dark). Expanded in Phase 5 (lyrics typography) and Phase 9 (PWA + OG generation).

## Source of truth

All visual primitives derive from `src/shared/theme/tokens.ts`. The MUI theme (`createBsTheme` in `src/shared/theme/theme.ts`), CSS variables on `html.light` / `html.dark` (`app/globals.css`), and `next-themes` (`BsThemeProvider`) share the same values.

**Never hardcode colors, shadows or radii in components** — use `cssVars.*` for semantic tokens (SSR-safe), `accent.*` for fixed brand decoration, or `useBsTheme()` in client components when mode-specific JS values are needed.

## Theme modes

| Layer                                     | Behavior                                                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Accent** (`accent.*`)                   | Fixed — electric, cyan, glow, indigo. Used for CTAs, play buttons, active nav, gradient text variants, selection highlight. |
| **Semantic** (`getSemanticPalette(mode)`) | Changes with theme — backgrounds, text, borders, status colors.                                                             |
| **CSS vars** (`cssVars.*`)                | `var(--bs-*)` references for Server Components and static `sx`.                                                             |
| **Preference**                            | `system` (default) \| `light` \| `dark`, stored in `localStorage` key `bs-theme`.                                           |

## Palette — dark (semantic)

| Role                  | Token / var           | Value                 |
| --------------------- | --------------------- | --------------------- |
| Background — primary  | `cssVars.bgPrimary`   | `#050B1A`             |
| Background — elevated | `cssVars.bgElevated`  | `#0B1A33`             |
| Background — glass    | `cssVars.bgGlass`     | `rgba(13,37,64,0.55)` |
| Text — primary        | `cssVars.textPrimary` | `#E6F0FF`             |
| Text — muted          | `cssVars.textMuted`   | `#8AA1C4`             |

## Palette — light (semantic)

| Role                  | Token / var           | Value                    |
| --------------------- | --------------------- | ------------------------ |
| Background — primary  | `cssVars.bgPrimary`   | `#F0F4FA`                |
| Background — elevated | `cssVars.bgElevated`  | `#FFFFFF`                |
| Background — glass    | `cssVars.bgGlass`     | `rgba(255,255,255,0.72)` |
| Text — primary        | `cssVars.textPrimary` | `#0D1F3C`                |
| Text — muted          | `cssVars.textMuted`   | `#5A7399`                |

## Accent (both modes)

| Role              | Token / var       | Value     |
| ----------------- | ----------------- | --------- |
| Accent — electric | `accent.electric` | `#1E90FF` |
| Accent — cyan     | `accent.cyan`     | `#4FD1FF` |
| Accent — glow     | `accent.glow`     | `#6EA8FE` |
| Accent — indigo   | `accent.indigo`   | `#6366F1` |

## Gradients

Mode-specific via `getGradients(mode)` / `useBsTheme().gradients`:

| Token                  | Use                                             |
| ---------------------- | ----------------------------------------------- |
| `gradients.aurora`     | Hero atmosphere, OG art, large display headings |
| `gradients.glow`       | Radial glow behind primary content blocks       |
| `gradients.spiritual`  | Vertical fade for full-bleed sections           |
| `gradients.topBarFade` | Sticky top bar background fade                  |

`<GradientText>` exposes the `aurora`, `cyan`, `indigo` and `cool` variants for typography.

## Typography

Single family: **Inter** (variable, latin + latin-ext, weights 300–700) loaded via `next/font/google` in `src/shared/theme/fonts.ts`. Exposed as `--bs-font-sans` CSS variable.

## Spacing & radii

- Spacing: 4-px scale via `spacing(n)` helper.
- Radii: `sm 8`, `md 12`, `lg 20`, `xl 28`, `pill 999`.

## Shadows & blur

Mode-specific via `getShadows(mode)` or `cssVars.shadowCard` / `shadowGlow` / `shadowGlowStrong`.

Blur scale: `sm 8px`, `md 16px`, `lg 24px`. Always include the `-webkit-` prefix for Safari.

## Motion

Defined in `tokens.motion`. Durations: `fast 160ms`, `base 240ms`, `slow 420ms`.

## Primitives

| Component              | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `AtmosphereBackground` | Full-bleed aurora + radial glow; opacities adapt to resolved theme.      |
| `GlassPanel`           | Translucent panel with blur, border and shadow.                          |
| `GradientText`         | Text painted by a gradient via `background-clip: text`.                  |
| `GlowButton`           | Pill button — `solid` (aurora gradient), `glass` (translucent), `ghost`. |
| `BrandMark`            | Nine-pointed star + optional wordmark.                                   |
| `ThemeSwitcher`        | System / light / dark preference (TopBar).                               |

## Layout primitives

| Component   | Notes                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| `AppShell`  | Sidebar + MobileNav + TopBar + content + PlayerBar + fixed atmosphere. |
| `TopBar`    | Search + ThemeSwitcher + LocaleSwitcher + auth placeholder.            |
| `PlayerBar` | Persistent footer; single global `<audio>`.                            |

## Rules

1. **No cover art dependency.** Typographic placeholders when no cover.
2. **One source of truth.** `tokens.ts` + `globals.css` + `createBsTheme`.
3. **Accents are decorative.** Do not use accent colors for body text or large backgrounds in light mode.
4. **Glass is the default surface.** Solid `bg.elevated` is the exception.
5. **Accessibility:** WCAG AA for text and interactive states in **both** themes; `prefers-reduced-motion` in Phase 10.
