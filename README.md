# BahaiSongs.org

Modern web platform for Bahá'í music, lyrics and chord sheets — inspired by Spotify / Apple Music / Ultimate Guitar, with a spiritual, premium, typography-led identity.

> **Repo:** [`rubjm9/bahaisongs`](https://github.com/rubjm9/bahaisongs) · **Status:** Phase 4 shipped — design system, full catalogue (140 songs), instant search, single-`<audio>` player with queue and Media Session. Phase 5 (lyrics + chords) is next.

## What works today

- Hero home with section shelves (recent, with-chords, prayers, calm)
- `/song/[slug]` page for each of the 140 tracks (SSG) with lyrics, neighbours nav and Open Graph metadata
- `/library`, `/category/[slug]`, `/artist/[slug]` browsing
- Instant search palette in the topbar (`/` to focus) and a full `/search` page with filters — tolerant to diacritics and apostrophes ("guiame" finds "Guíame")
- Global player with one `<audio>` element: timeline seek, play/pause, prev/next, shuffle, repeat (off / all / one), volume + mute, Media Session for lockscreen and multimedia keys, persisted user preferences
- Light / dark theme toggle with cookie sync (no FOUC)
- Collapsible sidebar
- `es` / `en` i18n (Spanish default)

## Stack

- **Next.js 15** App Router + RSC + Turbopack
- **TypeScript** strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **MUI v6** + **Emotion** (App Router cache provider)
- **Framer Motion** for transitions and atmosphere
- **Zustand** + **subscribeWithSelector** for client state (player, queue, theme)
- **TanStack Query** v5 for server cache (Phase 6+)
- **next-intl** for i18n (`es` default, `en`)
- **Fuse.js** for the client-side search index
- **Supabase** (Postgres + Auth + RLS + Edge Functions) — schema and ETL ready, connection happens in a later phase
- **Cloudflare R2** for audio / image storage — signing helpers ready
- **Vitest** + Testing Library, **Playwright** for e2e (planned)
- **ESLint** flat config (typescript-eslint strict) + **Prettier** + **husky** + **lint-staged**

## Folder structure

```
app/                       # Next.js routes (TS, RSC by default)
  [locale]/
    (public)/              # Home, search, library, song, playlist, artist, category, present, suggest
    (auth)/                # Login / callback (Phase 6)
    (admin)/               # Admin-only (Phase 7, role-gated)
src/
  features/                # Self-contained features
    catalog/               # Track lists, search, category labels
    player/                # Stores (player + queue), hooks, components
    auth/                  # Locale switcher, auth menu placeholder
    home/                  # Hero atmosphere
  entities/                # Canonical domain types
  shared/                  # UI primitives, theme, hooks, libs (Supabase, R2, i18n)
  server/                  # Server-only (RSC data loaders, future actions)
  data/                    # Generated JSON catalogues (committed)
scripts/                   # ETL & maintenance
  data/wordpress-export.xml
supabase/                  # SQL migrations + Edge Functions + config.toml
messages/                  # next-intl message catalogues (es.json, en.json)
docs/architecture/         # Living architecture docs + ADRs
docs/legacy/               # Historical pre-rebuild docs (read-only reference)
```

## Local development

```bash
npm install
cp .env.example .env.local   # only needed once Supabase + R2 are wired
npm run dev                  # http://localhost:3000 (español por defecto, sin prefijo /es)
```

## Scripts

| Command                      | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                | Next dev (Turbopack)                                                     |
| `npm run build`              | Production build                                                         |
| `npm run start`              | Serve production build                                                   |
| `npm run typecheck`          | TypeScript no-emit check                                                 |
| `npm run lint`               | ESLint flat config                                                       |
| `npm run format`             | Prettier write                                                           |
| `npm test`                   | Vitest                                                                   |
| `npm run build:search-index` | Regenerate `src/data/search-index.json` + `catalog.json` from the WP XML |
| `npm run etl:wordpress:dry`  | Parse WordPress export, print report (no DB writes)                      |
| `npm run etl:wordpress`      | Full ETL → Supabase + R2 (needs env vars)                                |
| `npm run db:start`           | `supabase start` (local Docker stack)                                    |
| `npm run db:reset`           | Apply migrations + seed                                                  |
| `npm run db:types`           | Generate `src/shared/lib/supabase/types.ts`                              |

## Roadmap

The full master plan lives at `docs/architecture/` (ADRs + design system + data model + storage + content & legal).

| Phase  | Deliverable                                                                 | Status |
| ------ | --------------------------------------------------------------------------- | ------ |
| **0**  | Foundation, clean restart, structure                                        | ✅     |
| **1**  | Design system + shell (sidebar, topbar, player placeholder, atmosphere)     | ✅     |
| **2**  | Supabase schema + RLS + ETL from WordPress + R2 helpers                     | ✅     |
| **3**  | Public catalog (read-only): home, song, library, artist, category + search  | ✅     |
| **4**  | Player (single `<audio>`, Zustand stores, queue, MediaSession, MP3+YouTube) | ✅     |
| **5**  | Lyrics + chords (ChordPro, transpose, capo, autoscroll, presentation mode)  | ⏳     |
| **6**  | Auth + favorites + playlists                                                | ⏳     |
| **7**  | Suggestions + admin moderation                                              | ⏳     |
| **8**  | Metrics + discovery                                                         | ⏳     |
| **9**  | SEO + PWA + perf                                                            | ⏳     |
| **10** | A11y + i18n EN complete + polish                                            | ⏳     |

## Architecture docs

- [`design-system.md`](docs/architecture/design-system.md) — palette, tokens, primitives, rules
- [`data-model.md`](docs/architecture/data-model.md) — PostgreSQL schema, RLS, indexes, ETL contract
- [`storage-r2.md`](docs/architecture/storage-r2.md) — R2 buckets, signing flows, CDN strategy
- [`content-and-legal.md`](docs/architecture/content-and-legal.md) — licensing, retention, moderation workflow
- [`adr/`](docs/architecture/adr) — Architecture Decision Records (append-only)

## Content provenance

The 140-track catalogue ships from `scripts/data/wordpress-export.xml`, exported from the legacy `bahaisongs.org` WordPress site. Lyrics are community-licensed Bahá'í material redistributable in the same community context. MP3 audio is sourced from `canciones.bahai.es` and will be migrated to Cloudflare R2 once the licensing checklist in [`content-and-legal.md`](docs/architecture/content-and-legal.md) is signed off.

## License

The application code is open source under a license to be confirmed (see `content-and-legal.md` open questions). Bahá'í Faith scripture and community lyrics are licensed separately under the redistribution policy of the community of authors. Takedown requests: contact the maintainer.
