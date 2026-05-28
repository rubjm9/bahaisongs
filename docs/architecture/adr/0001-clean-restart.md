# ADR 0001 — Clean restart, in-place

- **Status:** Accepted
- **Date:** 2026-05-24

## Context

The repository at the start of Phase 0 contained a Spotify-clone style Next.js 16 + Redux + CSS Modules app with 96 `.js` files, hardcoded data, no TypeScript in `src/`, and no Supabase/R2 integration. The master plan calls for a modern platform with TS strict, MUI, Zustand, TanStack Query, Supabase, R2, next-intl, feature-based architecture and a distinct visual identity (electric/cyan glow + glassmorphism, typography-led).

## Decision

**Clean restart in the same repository and same branch (`claude/bahai-songs-platform-CgRK9`).** Delete `app/`, `src/`, `package.json`, all configs and `public/` assets. Keep only:

- `bahaisongs.WordPress.2025-09-19.xml` → moved to `scripts/data/wordpress-export.xml` (input for Phase 2 ETL).
- `docs/` → moved to `docs/legacy/` for historical reference.
- `.git/` and `.gitignore` (the latter rewritten).

Rebuild from zero with the agreed stack and folder layout. Each subsequent phase ships as a single PR with CI green before the next begins.

## Consequences

- **+** Full alignment with the master plan from day 1; no retrofit debt.
- **+** Faster than migrating 96 JS files to strict TS + Zustand + MUI.
- **+** Branch keeps `.git` history intact, including the legacy commits — recoverable if needed.
- **−** Loses any incremental work the previous codebase had toward Supabase; mitigated by `docs/legacy/` keeping decisions and by the WP XML being the real content source.
- **−** Public favicon, manifest and SW are deleted and must be recreated in Phase 9 (PWA).

## Alternatives considered

- **Hybrid** (port `useSynchronizedLyrics`, `useDebounce`, `useSearch`, `useWindowSize` and SVG icons to TS): rejected because the surrounding architecture is incompatible and contamination risk outweighs the small win.
- **New repo from scratch**: rejected to keep the `.git` history and the branch already set up by the Claude Code on the web environment.
