# ADR 0003 — Postgres schema, RLS-from-day-one, R2 over Supabase Storage

- **Status:** Accepted
- **Date:** 2026-05-25

## Context

Phase 2 turns the empty shell of Phase 1 into a real product by giving it a database, a storage strategy and the migration from the legacy WordPress catalogue. Three large decisions were taken together because they shape every later phase.

## Decisions

### 1. Schema shape

- **`track_sources` is its own table.** A track has many ways to play (MP3 in R2, YouTube fallback, future Spotify mirror). The audio URL is never on `tracks`. The `is_primary` boolean is enforced unique per track via a partial index.
- **Lyrics keyed by `(track_id, locale)`.** Translations and ChordPro versions per language are first-class. The denormalised `body_plain` is what the FTS index reads; `body_chordpro` is the authoring format.
- **Categories are polymorphic** (`kind enum genre|mood|theme|tag`). One M2M table covers all axes. Cheaper than 4 separate join tables.
- **`play_events` accepts anonymous inserts** (RLS allows `user_id IS NULL`). This buys us discovery analytics for non-signed-in visitors without compromising per-user privacy.
- **`suggestions.payload` is JSONB.** The shape of a contribution evolves faster than `tracks` columns. Zod validates at the Server Action layer; the Edge Function expands it into normalised rows on approval.

### 2. RLS from day one

Every table has RLS enabled before any data lands. Public reads on the catalogue; owner-scoped writes on user data; admin gate via the `public.is_admin()` SECURITY DEFINER helper. No table is exposed without an explicit policy — default deny.

This is more upfront work than RLS-later, but retrofitting RLS to a populated database is significantly harder. Phase 6 (auth) and Phase 7 (suggestions) both depend on the policies being correct from the start.

### 3. Cloudflare R2 over Supabase Storage

- **Egress cost.** Music is bandwidth-heavy. R2 charges zero egress; Supabase Storage egress is metered.
- **CDN.** Cloudflare's edge cache for approved covers (`cdn.bahaisongs.org`) is one-click.
- **S3 compatibility.** Works with `aws4fetch` for browser-bound presigning and `@aws-sdk/client-s3` for any future heavy ETL. Identical code runs in Node, Edge Functions (Deno) and Cloudflare Workers.
- **Trade-off.** We give up the "everything in one dashboard" comfort of Supabase Storage; offset by the cost win and Cloudflare's CDN.

The buckets are private; reads always go through a signed URL (`sign-audio-url` Edge Function, 1 h TTL). Browser uploads (Phase 7) use signed PUTs (5 min TTL).

## Consequences

- **+** A schema with no obvious refactor pressure for at least the next 5 phases.
- **+** Anonymous discovery analytics from day one without privacy concerns.
- **+** Audio costs stay flat as the catalogue grows.
- **+** RLS testing is part of every later phase by default (Phase 6 E2E test exercises owner / admin / anon paths).
- **−** Two systems to operate (Supabase + Cloudflare). Mitigated by Edge Function being the only Cloudflare↔Postgres bridge.
- **−** Edge Function adds one network hop on every playback start. Cached by TanStack Query keyed on `trackId` for ~50 min, so the hop is one per song per hour per session.
- **−** ETL is conservative on chords: `lyrics.has_chords` is set but `body_chordpro` stays null until Phase 5 authoring lets admins fill it. Avoids polluting the data with wrong chord positions.

## Alternatives considered

- **Single `tracks.audio_url` column.** Rejected — locks us out of multi-source / YouTube fallback / future Spotify mirrors.
- **Lyrics as a column on `tracks`.** Rejected — translations would require a flat schema with `lyrics_es`, `lyrics_en`, `lyrics_pt` columns or a JSONB blob; both fight the FTS index.
- **Supabase Storage instead of R2.** Rejected — egress cost and lack of zero-config CDN, as above.
- **No RLS for the public catalogue, plus an admin write-only API.** Rejected — adding RLS later forces a backfill audit; one consistent enforcement layer is simpler.
- **Auto-conversion of legacy "(La M, Re M)" prologues to ChordPro.** Rejected — we'd invent chord positions over lyrics and call it canonical data. Phase 5 admin authoring is the only correct path.
