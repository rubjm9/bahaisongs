# ADR 0002 — Visual language: electric/cyan, glass-first, dual theme

- **Status:** Amended
- **Date:** 2026-05-24 (amended 2026-05-26)

## Context

The master prompt asks for an identity that mixes Google's recent electric/luminous direction with Apple's premium glassmorphism, while staying functionally close to Spotify. It must look premium even when no cover art is available — the legacy catalog has very few real covers and stock photography would feel cheap.

## Decision

1. **Dual theme (light + dark)** with user preference: system / light / dark (`next-themes`, default `system`). Semantic surfaces and text invert per mode; **accent colors stay fixed** as decorative brand elements (buttons, glow, active nav, gradients on CTAs).
2. **Single accent family**: electric blue → cyan → glow → indigo gradient. No secondary palette. Accents do not change between themes.
3. **Glass-first surfaces**: the default surface is semantic `bg.glass` with `backdrop-filter: blur(16px)`. Solid `bg.elevated` is reserved for cases where blur is impossible.
4. **Typography-led**: no screen depends on imagery to look premium. Cover-less items render typographic placeholders (initials over aurora-gradient).
5. **Single font**: Inter Variable via `next/font/google`.
6. **Sparing motion**: small entrance translations (8–16 px), short durations (240–420 ms), expo easing. No bouncing, no parallax.
7. **Atmosphere in light mode**: aurora/glow layers use the same accent hues at **reduced opacity** so they read as decoration, not as a second palette.

## Consequences

- **+** Strong, distinctive identity — does not read as a Spotify clone.
- **+** Cover-art-light catalog remains viable in both modes.
- **+** Users who prefer light UI (or OS setting) are accommodated without diluting brand accents.
- **−** Blur is expensive on low-end Android; `intensity="low"` shell default keeps it manageable.
- **−** Two semantic palettes must stay in sync with CSS variables (`app/globals.css`) and MUI `createBsTheme`.
- **−** WCAG AA must be verified for both modes (text on glass, accent on elevated surfaces).

## Alternatives considered

- **Dark-only forever**: rejected — product now ships light mode with fixed decorative accents.
- **System-driven accents that invert with theme**: rejected — brand colors remain decorative and constant.
- **Neumorphism / skeuomorphism**: explicitly rejected by the master prompt.
- **Cover-first grids (Spotify-style)**: rejected because the data does not support it.
