# Documentación previa a la migración

Material generado al cerrar los pasos previos (Next.js, Zustand, Supabase).

| Documento                                                          | Contenido                                                                                                                           |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| [PRE_MIGRATION_SSR_INVENTORY.md](./PRE_MIGRATION_SSR_INVENTORY.md) | `window` / `document` / `localStorage`, rutas, layout, audio global (las pantallas viven ahora en `src/views/`, no en `src/pages/`) |
| [DATA_CONTRACT.md](./DATA_CONTRACT.md)                             | Modelo `Track`, playlist, letras sincronizadas, orientación Supabase                                                                |
| [PLAYER_SURFACE.md](./PLAYER_SURFACE.md)                           | Estado y acciones del reproductor, regla del `<audio>` único                                                                        |
| [NEXT_DECISIONS.md](./NEXT_DECISIONS.md)                           | App Router vs Pages, MUI progresivo, TypeScript por fases, checklist de spike                                                       |
| [BASELINE.md](./BASELINE.md)                                       | Tests, build, tamaños de bundle, Lighthouse opcional                                                                                |
| [CONTENT_AND_LEGAL.md](./CONTENT_AND_LEGAL.md)                     | Audio, carátulas, YouTube, privacidad — checklist pre-storage                                                                       |
