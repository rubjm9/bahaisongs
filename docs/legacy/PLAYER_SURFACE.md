# Superficie mínima del reproductor y regla del `<audio>` único

Documento previo a **Redux → Zustand** y al wrap en Next: qué estado y acciones son el núcleo del player y cómo está montado el audio.

## Regla: una sola instancia de `<audio>`

- El elemento `<audio>` se renderiza **una vez** en [`src/component/footer/footer.js`](../src/component/footer/footer.js), pasando `ref={audioRef}` a [`src/component/footer/audio.js`](../src/component/footer/audio.js).
- **No** hay rutas que monten otro `<audio>`; el footer es global en `App.js`.
- En **Next.js**: mantener esta regla en el layout cliente (p. ej. `PlayerShell` con `"use client"`) para evitar doble montaje al navegar, problemas de hidratación y dos pistas sonando.

Volumen hoy: estado local `volume` en `footer.js` (no está en Redux); `audioRef.current.volume` se sincroniza por `useEffect`. Cualquier store futuro debería **incluir volumen** si se quiere persistir o controlar desde más de un sitio.

## Estado en Redux (`playerSlice`)

Definido en [`src/store/slices/playerSlice.js`](../src/store/slices/playerSlice.js).

| Campo                   | Tipo conceptual    | Responsabilidad                                         |
| ----------------------- | ------------------ | ------------------------------------------------------- |
| `trackData.trackKey`    | `[number, number]` | Índice playlist + índice canción en `PLAYLIST` (legacy) |
| `trackData.track`       | `string`           | URL del audio                                           |
| `trackData.trackName`   | `string`           | Título                                                  |
| `trackData.trackImg`    | `string`           | URL imagen                                              |
| `trackData.trackArtist` | `string`           | Artista                                                 |
| `isPlaying`             | `boolean`          | Play / pause                                            |
| `currentTime`           | `number`           | Segundos; alimenta letras sincronizadas                 |
| `duration`              | `number`           | Segundos (metadata)                                     |
| `isLoading`             | `boolean`          | Buffer / carga                                          |
| `error`                 | `string \| null`   | Mensaje usuario                                         |

## Acciones exportadas

- `playPause(isPlaying: boolean)`
- `changeTrack([playlistIndex, songIndex])` — valida contra `PLAYLIST` importado en el slice
- `setCurrentTime(seconds)`
- `setDuration(seconds)`
- `setLoading(boolean)`
- `setError(string | null)`

## Selectores

`selectTrackData`, `selectIsPlaying`, `selectCurrentTime`, `selectDuration`, `selectIsLoading`, `selectError`.

## Comportamiento ligado al DOM (footer, no al slice)

- **Play/pause real**: `useEffect` en `footer.js` llama `audioRef.current.play()` / `pause()` según `isPlaying`.
- **Fin de pista**: listener `ended` en `footer.js` — calcula siguiente índice en la misma playlist y despacha `changeTrack`.
- **Seek**: `handleTrackClick` escribe `audioRef.current.currentTime`.
- **Historial**: `addToHistory` en `useEffect` al cambiar `trackData.trackKey` (acoplamiento a otro slice).

## Propuesta para Zustand (superficie mínima)

Agrupar en un solo store (o slice lógico) lo que hoy está en `playerSlice` **más** `volume` si se desea unificar. Mantener `changeTrack` desacoplado de Redux: idealmente recibiría un **`Track` canónico** (ver `DATA_CONTRACT.md`) además de o en lugar de índices, cuando exista `trackId` desde Supabase.

Cola explícita (“queue”) **no** existe hoy como array en Redux; la “cola” es la playlist actual + auto-siguiente al terminar. Si la fase de producto pide cola real, ampliar el contrato con `queue: Track[]` y `queueIndex` sin romper el `<audio>` único.

## Integración letras

- `currentTime` e `isPlaying` deben seguir actualizándose en tiempo de reproducción (hoy vía `onTimeUpdate` → `setCurrentTime`).
- Cualquier migración a Zustand debe **seguir** publicando tiempo con la misma frecuencia o throttled para no degradar scroll de letras.
