# Contrato de datos (track, playlist, letras) — previo a Supabase y Zustand

Objetivo: una **forma canónica** en la aplicación que la UI y el futuro backend compartan, con mapeo claro desde `bahai-songs.js` y hacia tablas Supabase.

## Convenciones generales

- **Tiempos de audio y letras**: segundos (`number`), no milisegundos, salvo que en DB se guarde entero en ms y se convierta en el borde API.
- **IDs**: hoy las canciones se identifican en rutas como `songId` (string) y en datos con `index` string dentro de playlist; el contrato canónico recomienda **`trackId: string` estable** (p. ej. slug o UUID) para URLs y para claves de favoritos/historial en servidor.
- **Índices de playlist legacy**: `[playlistIndex, songIndex]` siguen siendo válidos en cliente mientras exista el array `PLAYLIST`; al migrar, el reproductor debería resolver `trackId` ↔ posición en cola local.

---

## Entidad: `PlaylistMeta` (álbum / colección)

Alineado con cada elemento raíz de `PLAYLIST` en [`src/data/bahai-songs.js`](../src/data/bahai-songs.js).

| Campo canónico | En datos actuales         | Notas Supabase (ejemplo)                       |
| -------------- | ------------------------- | ---------------------------------------------- |
| `playlistId`   | Derivado de `link` (slug) | `playlists.slug` PK o `id` UUID + `slug` único |
| `title`        | `title`                   | `playlists.title`                              |
| `type`         | `type`                    | texto / categoría                              |
| `coverUrl`     | `imgUrl`                  | Storage o URL externa                          |
| `hoverColor`   | `hoverColor`              | opcional UI                                    |
| `artist`       | `artist`                  | texto o FK `artists`                           |
| `playlistBg`   | `playlistBg`              | opcional UI                                    |
| `path`         | `link`                    | slug para ruta `/playlist/:path`               |

---

## Entidad: `Track` (canción)

Unión de lo que muestra el detalle, el buscador y lo que consume `playerSlice` al hacer `changeTrack`.

| Campo canónico       | En datos actuales                                            | Uso en app                     | Supabase (orientativo)                             |
| -------------------- | ------------------------------------------------------------ | ------------------------------ | -------------------------------------------------- |
| `trackId`            | Ideal: slug estable; hoy a menudo `index` dentro de playlist | URL `/song/:songId`, favoritos | `tracks.id` o `tracks.slug`                        |
| `title`              | `songName`                                                   | UI, Media Session              | `tracks.title`                                     |
| `artistName`         | `songArtist`                                                 | UI                             | `tracks.artist_name` o relación                    |
| `audioUrl`           | `link`                                                       | `<audio src>`                  | `tracks.audio_url` o Storage path                  |
| `coverUrl`           | `songimg`                                                    | carátula                       | Storage / URL                                      |
| `durationLabel`      | `trackTime`                                                  | display opcional               | derivado de metadata o `duration_seconds`          |
| `lyricsPlain`        | `lyrics`                                                     | texto estático, búsqueda       | `tracks.lyrics` (text)                             |
| `excerpt`            | `excerpt`                                                    | cards / previews               | opcional                                           |
| `syncedLyrics`       | Opcional; no presente aún en todos los temas del dataset     | `SynchronizedLyrics`           | JSONB o tabla `lyric_lines`                        |
| `chordsPlain`        | Opcional; hoy mezclado en `lyrics`                           | futuro acordes                 | campo o adjunto                                    |
| `playlistId` / orden | Implícito por posición en `playlistData`                     | navegación                     | `playlist_tracks(playlist_id, position, track_id)` |

### Identificación en rutas hoy

- `song-detail` y búsqueda resuelven por `songId` frente a datos aplanados o por `index`; al definir `trackId` único global, las rutas deberían migrar a ese id para no colisionar entre playlists.

---

## Letras sincronizadas: formato en app (`syncedLyrics`)

Contrato consumido por [`useSynchronizedLyrics`](../src/hooks/useSynchronizedLyrics.js) y [`SynchronizedLyrics`](../src/component/lyrics/SynchronizedLyrics.js).

Cada elemento es un objeto:

```ts
type SyncedLyricLine = {
  text: string;
  startTime: number; // segundos, inclusive
  endTime: number; // segundos (usado en agrupación / UI)
  line?: number; // agrupa segmentos en la misma línea visual; default 1
};
```

Reglas:

1. Las líneas están **ordenadas** por `startTime` ascendente.
2. La línea activa en tiempo `t` es la última donde `t >= startTime` y (si hay siguiente) `t < next.startTime` (ver hook; `endTime` no es el único criterio de corte).
3. Si no hay `syncedLyrics` o está vacío, la UI usa **`lyricsPlain`** (fallback).

### Evolución recomendada: LRC

- **Almacenamiento**: se puede guardar LRC como texto en DB y **convertir a `SyncedLyricLine[]`** en el cliente o en una Edge Function.
- **Import/export**: LRC facilita editores externos y WordPress; el contrato en runtime sigue siendo el array anterior para no reescribir el hook de golpe.

---

## Favoritos e historial: servidor vs cliente

| Dato      | Hoy                    | Decisión previa a implementar                                                           |
| --------- | ---------------------- | --------------------------------------------------------------------------------------- |
| Favoritos | `localStorage` + Redux | Con login: tabla `user_favorites(track_id)`; migración: importar claves locales una vez |
| Historial | `localStorage` + Redux | Con login: `play_events` o `user_history` con límite; sin login: seguir local           |
| Tema      | `localStorage`         | Suele quedarse local o `user_preferences`                                               |

Evitar **doble fuente de verdad**: si hay login, las acciones de favorito deben ir a API y reflejarse en caché (p. ej. TanStack Query), no solo a localStorage.

---

## Referencia rápida de archivos

- Dataset principal: [`src/data/bahai-songs.js`](../src/data/bahai-songs.js) (`PLAYLIST` exportado vía [`src/data/index.js`](../src/data/index.js)).
- Estado reproductor que materializa un “track activo” distinto del modelo playlist: [`src/store/slices/playerSlice.js`](../src/store/slices/playerSlice.js) (`trackData`).
