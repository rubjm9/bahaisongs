# Storage — Cloudflare R2

Status: Phase 2 — shipped. The Next.js app never touches R2 directly from the browser: all reads go through the `sign-audio-url` Edge Function, all writes (Phase 7 suggestions) go through a sibling `sign-suggestion-upload` Edge Function and a one-shot PUT.

## Why R2

- **S3-compatible API** — works with `aws4fetch` / `@aws-sdk/client-s3` unchanged.
- **No egress fees** — important for a music platform where audio is the bulk of traffic.
- **Cloudflare CDN in front** — we serve approved covers and avatars via `cdn.bahaisongs.org` with a 30-day cache and signed origin.
- We are not using Supabase Storage. R2's pricing model is more predictable at the catalog scale we expect.

## Buckets

| Bucket              | Purpose                                      | Visibility                     | TTL on signed reads      |
| ------------------- | -------------------------------------------- | ------------------------------ | ------------------------ |
| `bahaisongs-audio`  | MP3 audio (legacy migrated + future uploads) | Private                        | 1 h                      |
| `bahaisongs-images` | Album covers, playlist covers, user avatars  | Private (CDN signs the origin) | 30 d (CDN), 1 h (origin) |

Both buckets are **private** — no public R2 endpoint. Reads always pass through a signed URL.

## Path conventions

```
bahaisongs-audio/
  audio/{trackId}/legacy.mp3            # imported from canciones.bahai.es
  audio/{trackId}/{sourceId}.mp3        # additional sources
  incoming/{suggestionId}/{filename}    # Phase 7 user uploads, pre-moderation

bahaisongs-images/
  covers/album/{albumId}.webp
  covers/playlist/{playlistId}.webp
  avatars/{userId}.webp
  hero/og-default.png
```

All `track_sources.source_ref` rows store the object key (e.g. `audio/{trackId}/legacy.mp3`) — never the full URL. URL composition belongs to the Edge Function.

## Signing — read flow

1. Client calls `GET /functions/v1/sign-audio-url?track={slug}`.
2. The Edge Function authenticates against Supabase (anon key + RLS lets it read published tracks).
3. It locates the primary `mp3_r2` source.
4. It builds and SigV4-signs an R2 GET URL with `X-Amz-Expires=3600`.
5. Response: `{ url, expiresAt }`.
6. The client passes `url` as the `<audio src>`.

Phase 4 caches the signed URL via TanStack Query keyed by `trackId`, with `staleTime: 50 minutes` (10 min margin under the TTL).

## Signing — upload flow (Phase 7)

1. Authenticated user opens `/suggest`. Form validates with Zod.
2. Form requests `POST /api/suggestion-upload-url` with `{ filename, contentType }`.
3. Route Handler / Edge Function returns a signed PUT URL pointing at `incoming/{tempId}/{filename}` with `X-Amz-Expires=300`.
4. Browser PUTs the file directly to R2 — no upload bytes ever pass through our own servers.
5. Form submits the suggestion payload referencing `tempId`.
6. On admin approval, the `approve-suggestion` Edge Function **moves** the object from `incoming/{tempId}/...` to `audio/{trackId}/{sourceId}.mp3` and inserts the `track_sources` row.

## Signing — implementation

The shared helpers live in `src/shared/lib/r2/signing.ts` and use `aws4fetch`. The Edge Function at `supabase/functions/sign-audio-url/index.ts` is the same algorithm, imported via Deno `npm:` specifier so it runs unmodified in the Supabase Edge runtime.

Constants:

```ts
DEFAULT_READ_TTL_SECONDS = 3600; // 1 h
DEFAULT_UPLOAD_TTL_SECONDS = 300; // 5 min
```

## Environment variables

```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_AUDIO            # default: bahaisongs-audio
R2_BUCKET_IMAGES           # default: bahaisongs-images
R2_PUBLIC_CDN_BASE_URL     # https://cdn.bahaisongs.org
```

These are server-only. Never expose `R2_SECRET_ACCESS_KEY` to the browser. The browser only ever sees pre-signed URLs.

## CDN strategy

`cdn.bahaisongs.org` is a Cloudflare Worker (or simple Cloudflare CDN rule) in front of the `bahaisongs-images` bucket. Approved covers and avatars are served with `Cache-Control: public, max-age=2592000, immutable`. Audio is **not** routed through this CDN — every MP3 fetch needs the freshness of a signed URL because access can be revoked.

## Failure modes & mitigation

| Failure                          | Mitigation                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Signed URL expires mid-playback  | Player listens for `MEDIA_ERR_NETWORK` and re-signs via the Edge Function (Phase 4).                                       |
| Edge Function down → no playback | Frontend shows the lyrics + a "Try again" CTA. YouTube fallback source (if present on the track) takes over automatically. |
| R2 region outage                 | We accept it for Phase 2–10. A second region copy is a Phase ≥11 concern.                                                  |
| Service-role key leaked          | Rotation is one Supabase dashboard action; key is server-only.                                                             |
