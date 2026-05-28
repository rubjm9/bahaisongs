# Data model

Status: Phase 2 — shipped. The PostgreSQL schema lives in `supabase/migrations/` and is the single source of truth. This document explains the entities, the relationships, and the reasoning. Run `npm run db:types` after migrating to regenerate `src/shared/lib/supabase/types.ts`.

## Entities (PostgreSQL)

```
auth.users                      Supabase Auth (managed)
   │  1:1 (trigger handle_new_user)
   ▼
public.profiles ── display_name, avatar_path, role, locale
   │ 1:N
   ├── public.playlists ── visibility ── public.playlist_tracks (N:N tracks)
   ├── public.likes
   ├── public.play_events           (user_id nullable for anonymous)
   └── public.suggestions

public.artists ── 1:N ── public.albums ── 1:N ── public.tracks
                                                      │
                                                      ├─ 1:N ── public.track_sources       (mp3_r2 | youtube)
                                                      ├─ N:N ── public.track_artists       (role: lead/feat/composer/arranger)
                                                      ├─ N:N ── public.track_categories ── public.categories
                                                      └─ 1:N ── public.lyrics              (one per locale)
```

## Why this shape

1. **`track_sources` is its own table** — a song can have an MP3 in R2 and a YouTube fallback, or several MP3 versions (live / studio). The `is_primary` boolean (enforced unique per track via partial index) drives the player. The audio URL is **never** stored on `tracks` directly.
2. **Lyrics keyed by `(track_id, locale)`** — a song can have a Spanish lyric and an English translation. ChordPro lives in `body_chordpro`; the denormalised `body_plain` is what the full-text index reads. `has_chords` is a fast filter for "songs you can sing along to". `synced_json` (JSONB) is optional and enables the synced "follow" mode without forcing every track to support it.
3. **Categories are a single polymorphic table** with `kind` (`genre`/`mood`/`theme`/`tag`). Avoids a category-explosion of 4 near-identical tables and keeps the M2M simple.
4. **`play_events` accepts anonymous inserts** — anyone can log a play (RLS allows `user_id IS NULL` inserts) so we don't lose discovery analytics for non-signed-in visitors. Per-user reads are owner-scoped.
5. **`suggestions` carries a JSONB `payload`** — the shape of a contribution can evolve faster than the rigid columns of `tracks`. Validated by Zod in the Server Action layer, persisted as JSONB. The approval flow's Edge Function expands it into `tracks` + `track_sources` + `lyrics` etc.
6. **No `audio_url` on `tracks`** — encourages going through R2 signed URLs from the Edge Function. The signing is the only place that knows the bucket + path layout, so we can rotate buckets without touching the schema.
7. **`citext` for all slugs and display_name** — case-insensitive comparison without `LOWER(...)` everywhere.
8. **Language as `text` with regex check, not enum** — extending to PT, FR, FA etc. would not require a migration; the check constraint guards against typos.

## RLS summary

Default deny. See `0004_rls.sql` for full policies.

| Table                                                                                                       | anon SELECT                                       | user own                    | user write         | admin        |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------- | ------------------ | ------------ |
| `artists`, `albums`, `tracks`, `track_sources`, `track_artists`, `track_categories`, `categories`, `lyrics` | ✓ all rows                                        | —                           | —                  | full CRUD    |
| `playlists`                                                                                                 | ✓ where `visibility IN ('public','unlisted')`     | ✓ own rows                  | ✓ own rows         | full CRUD    |
| `playlist_tracks`                                                                                           | ✓ through parent playlist visibility              | ✓ via own playlist          | ✓ via own playlist | full CRUD    |
| `likes`                                                                                                     | ✗                                                 | ✓ own                       | ✓ own              | —            |
| `play_events`                                                                                               | ✗ on SELECT; INSERT allowed for `user_id IS NULL` | own SELECT                  | INSERT only        | admin SELECT |
| `suggestions`                                                                                               | ✗                                                 | own SELECT, own withdraw    | INSERT only        | full CRUD    |
| `profiles`                                                                                                  | ✓ (minimal columns visible)                       | UPDATE own (but not `role`) | —                  | full CRUD    |

The `public.is_admin()` SECURITY DEFINER function is the single source of truth for the admin gate; never inline `role = 'admin'` checks in policies.

## Indexes & search

- `tracks.search_tsv` — weighted tsvector (`title` A, `artist` B, `album` C, `lyrics` D) with the Spanish FTS config, maintained by `tracks_search_tsv_update` trigger.
- Trigram GIN on `tracks.title`, `artists.name`, `lyrics.body_plain` for fuzzy/typo-tolerant matching.
- Hot list / discovery indexes on `tracks.published_at`, `play_events (track_id, played_at)`, `play_events (user_id, played_at)`.
- Partial index `playlists (updated_at desc) WHERE visibility='public'` for the public discovery feed.

## Generated types

Run `npm run db:types` after `npm run db:start` to regenerate `src/shared/lib/supabase/types.ts` from the live local schema. The placeholder committed today is a minimal `Database` shape so the Supabase wrappers compile.

## Seed data

`supabase/seed.sql` seeds the category vocabulary (genres / themes / moods / tags). It is idempotent — re-running `supabase db reset` is safe. Track content is **never** seeded from SQL — only the ETL (`scripts/import-wordpress.ts`) inserts tracks.

## ETL contract

`scripts/import-wordpress.ts` parses `scripts/data/wordpress-export.xml`:

| WP source                                                                         | Schema destination                                                                           |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `<title>`                                                                         | `tracks.title`                                                                               |
| `<wp:post_name>` (slug)                                                           | `tracks.slug`                                                                                |
| `<wp:post_date_gmt>`                                                              | `tracks.published_at`                                                                        |
| `<content:encoded>` (HTML)                                                        | `lyrics.body_plain` (after `htmlToText`) + `lyrics.has_chords` (from tag + heuristic)        |
| WP category `canciones-espanol`                                                   | language `es` + `categories.cancion`                                                         |
| WP category `english`                                                             | language `en` + `categories.cancion`                                                         |
| WP category `oraciones`                                                           | `categories.oracion`                                                                         |
| WP tag `con-acordes`                                                              | `categories.con-acordes` + `lyrics.has_chords = true`                                        |
| WP tag `con-audio`                                                                | `categories.con-audio`                                                                       |
| WP tag `texto-sagrado`, `bab`, `tranquila`, `muy-ritmica`, `palabra-oculta`, etc. | matching `categories.slug`                                                                   |
| `wp:postmeta enclosure` MP3 URL                                                   | downloaded → R2 `audio/{trackId}/legacy.mp3` → `track_sources(kind=mp3_r2, is_primary=true)` |

All upserts are idempotent (`ON CONFLICT (slug)`). The script can be re-run safely.

**Conservative chord handling.** The legacy HTML has chord names as parenthesised prologues — they are not positionable inline. The ETL therefore sets `lyrics.has_chords` but **does not** populate `body_chordpro`. Phase 5 authoring tools will let admins author the real ChordPro per song.

## Numbers (from `npm run etl:wordpress:dry`)

```
Total parsed tracks:   140
With audio (MP3):       82
With chord hints:       71

By language:
  es                   139
  en                     1
```
