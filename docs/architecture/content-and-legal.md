# Content & legal

Status: Phase 2 — first cut. Rewritten from `docs/legacy/CONTENT_AND_LEGAL.md` to reflect the new infra (Supabase + R2). Not legal advice; a record of the product-level criteria the team has agreed.

## Scope

This document covers what we may store, redistribute and embed, and the takedown / moderation processes that flow from it.

## Audio

1. **Legacy catalogue (140 songs from `canciones.bahai.es`).** Treated as community-licensed Bahá'í material redistributable in the same community context. Before Phase 2 ETL ships to production R2, a named person must sign off on a list of titles + sources. Until that sign-off, ETL runs in `--dry-run` only (no MP3s are pushed to R2).
2. **User-submitted MP3s (Phase 7).** The `/suggest` form requires the submitter to tick an "I have the right to share this recording" box. The admin queue records the submitter and a timestamp. The Edge Function that approves a suggestion preserves the submitter id in the `track_sources` row's audit notes (Phase 7).
3. **YouTube sources.** We use the official iframe embed only. We never download YouTube audio. We never re-host it.

## Lyrics

1. The Bahá'í Faith's primary scripture and selected Hidden Words are in the public domain in most jurisdictions; the community translations and song-specific lyrics in our catalogue are treated as community-licensed and redistributable.
2. Translation credit must be preserved when known. Phase 5 introduces a `lyrics.credit` field if/when we receive translator-specific licensing.
3. Per-song takedown: any author or rightsholder can email the address in the public footer asking for removal. SLA: 7 days to evaluate; immediate removal on confirmed claim.

## Covers and avatars

1. **No stock photography is allowed** in production. The platform's typographic-placeholder rule (see `design-system.md`) is part of this stance — we never use Unsplash / Pexels / etc. for album art.
2. User avatars are user-provided; a profanity/abuse filter is added in Phase 6 as part of moderation.
3. Brand iconography (`BrandMark` — stylised nine-pointed star) is our own work.

## YouTube embed compliance

1. The iframe is loaded via `react-player` (Phase 4), without modification of its DOM. We do not bypass ads, autoplay restrictions, or age gates.
2. No data is sent to YouTube beyond what the standard embed sets. Phase 9 cookie banner discloses YouTube cookies for visitors who play a YouTube-sourced track.
3. The YouTube source is shown as a fallback when the MP3 source is unavailable, with a visible "Source: YouTube" indicator.

## Analytics & privacy

1. `play_events` accepts anonymous rows (`user_id IS NULL`). Anonymous events carry only the track id, timestamp and completion ratio — no IP, no fingerprint, no referrer.
2. Authenticated users' `play_events` are visible only to themselves and to admins (RLS). Phase 8 builds discovery views that **aggregate across users**; raw individual events are never displayed to other users.
3. Phase 9 ships the privacy notice, the cookie banner and the data-export endpoint (`/account/export`).

### Google Analytics 4 (GA4)

BahaiSongs uses GA4 for traffic and interaction analytics with **tacit consent**: scripts load by default (`analytics_storage: 'granted'`). A notice banner (`CookieConsent`) informs users that continuing to browse implies acceptance; Accept or close only dismisses the notice.

**Automatic collection**

| Signal | Mechanism |
| ------ | --------- |
| Page views | SPA navigations via `GoogleAnalyticsPageViews` |
| User dimensions | `locale`, `authenticated` via `setUserProperties` |

**Custom events** (via `src/shared/lib/analytics/track.ts`)

| Event | When it fires | Key parameters |
| ----- | ------------- | -------------- |
| `play` | Audio starts | `track_slug`, `source` (`discover`, `search`, `playlist:{slug}`, `player`) |
| `search` | User searches (discover / palette) | `search_term` |
| `login` | Successful sign-in (OAuth or email) | `method` |
| `add_to_wishlist` | Like / unlike | `track_slug`, `action` (`add` / `remove`) |
| `add_to_playlist` | Track added to playlist | `track_slug`, `playlist_id` |
| `share` | WhatsApp share click | `method`, `content_type` |
| `generate_lead` | Suggestion form submitted | — |
| `view_item` | Presentation mode opened | `item_id` (song slug) |
| `select_content` | Track or search result clicked | `content_type`, `item_id` |
| `locale_change` | Language switched | `from`, `to` |
| `theme_change` | Theme switched | `theme` |

**Product analytics (Supabase)** — `play_events` remains the source of truth for admin dashboards and trending. Rows include contextual `source` and `completion` (0–1, updated on pause or track change).

### GA4 console setup (manual)

After deploying events to production:

1. **Register custom dimensions** (Admin → Custom definitions): `track_slug`, `source`, `locale`, `search_term`, `authenticated`.
2. **Exploration reports**:
   - Funnel: session → `search` → `play` → `add_to_wishlist`
   - Top tracks by `play` event count
   - Traffic sources vs. engagement time
3. **Link Search Console** (Admin → Product links) for SEO queries and landing pages.
4. **DebugView**: use the GA Debugger extension or `debug_mode` to verify events in real time before promoting.
5. **Retention & engagement**: GA4 calculates these automatically once custom events are flowing.

Optional: enable **Cloudflare Web Analytics** in the Pages dashboard for cookieless pageview baseline (no code changes).

## Storage retention

| Data                               | Retention                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `play_events`                      | 12 months rolling, then aggregate-only                                                   |
| `suggestions` (pending / rejected) | 90 days after rejection, then payload archived to `incoming/archive/` and DB row deleted |
| `suggestions` (approved)           | Indefinite (audit trail)                                                                 |
| R2 `incoming/` blobs               | 7 days after rejection, then hard-deleted                                                |
| R2 `audio/{trackId}/` blobs        | Indefinite                                                                               |

## Approval workflow

1. `pending` is the default state for any new `suggestions` row.
2. An admin reviews the audio, lyrics, ChordPro and proposed metadata.
3. On approval: Edge Function inserts the track + sources + lyrics + categories, moves the R2 blob from `incoming/` to `audio/{trackId}/...`, and sets `suggestions.status = 'approved'`. The original submitter id is preserved.
4. On rejection: Edge Function writes the `review_notes`, sets status `'rejected'`. The R2 blob is queued for deletion (`incoming/archive/`).
5. The submitter is notified via the in-app inbox (Phase 7).

## Responsible

Designate a named person or rotating committee that owns:

- Periodic licensing review (every 6 months)
- Takedown response
- Admin role grants
- Storage retention sweeps

The current placeholder is the project owner; Phase 6 introduces an `admin_log` table to make the audit trail explicit.

## Open questions (tracked, not yet decided)

- [ ] Migration of `canciones.bahai.es` MP3s — final list and authorisation letter.
- [ ] Whether to expose author names on every Bahá'í scripture excerpt, or only on songs.
- [ ] PT-language catalogue: where to source canonically licensed translations.
- [ ] A formal `LICENSE` for the open-source platform code itself (BahaiSongs UI vs. content licensing are separate).
