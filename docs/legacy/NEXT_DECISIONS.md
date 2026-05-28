# Decisiones previas: Next.js, MUI y TypeScript

Este documento fija criterios **antes** del “wrap” en Next (Fase 1 del roadmap), basados en el estado del repo: mucha UI en **CSS Modules** + variables en [`src/style/variables.css`](../src/style/variables.css), **shell global** con footer/audio (ver `PRE_MIGRATION_SSR_INVENTORY.md`), y **casi todo dependiente del cliente**.

## App Router vs Pages Router

**Recomendación: App Router** (`app/`) con estas condiciones:

- Layout raíz con sidebar + `children` + footer reproductor en un **client layout** o segmento con `"use client"` donde haga falta el store y el audio.
- Las rutas actuales (`/song/[songId]`, etc.) se mapean a `app/song/[songId]/page.tsx` (o nombres equivalentes).

**Por qué no insistir en Pages**: el proyecto no depende de `getServerSideProps` para datos; el catálogo sigue siendo estático/cliente hasta Supabase. App Router ofrece layouts anidados alineados con el footer global y es la dirección por defecto de Next 13+.

**Mitigación**: muchos archivos necesitarán `"use client"` al principio; es aceptable para una SPA musical. Evitar lógica de `window` en módulos importados por Server Components sin esa directiva.

## MUI (Material UI)

**Recomendación: adopción progresiva.**

- Fase inicial del wrap: priorizar **paridad visual** moviendo componentes existentes (CSS Modules) sin reescribir todo en MUI.
- Introducir MUI para: formularios, diálogos, snackbars, data display nuevo, o pantallas nuevas post-login.
- **Tema**: si se activa `ThemeProvider` de MUI, mapear tokens a [`data-theme`](../src/store/index.js) en `document.documentElement` para no tener dos verdadades (documentar variables duales o un solo “source of truth” en CSS + `CssBaseline` + overrides).

## TypeScript

**Recomendación: en dos tiempos.**

1. **Primer hito Next**: puede ser JavaScript en `app/` para reducir fricción, con `allowJs` si se mezcla, **o** TypeScript solo en `app/layout.tsx`, rutas y nuevos stores.
2. **Segundo hito**: migrar `src/` gradualmente (player, datos, hooks) a `.ts` / `.tsx` con tipos alineados a `docs/DATA_CONTRACT.md`.

Ventaja de TS temprano en `app/`: el contrato `Track` y las rutas dinámicas quedan tipadas antes de conectar Supabase.

## Spike mínimo sugerido (checklist manual)

Antes de mover el monorepo completo, validar en un directorio temporal o rama:

1. `create-next-app` con App Router, TypeScript opcional, sin src dir o con `src/` según preferencia del equipo.
2. Instalar MUI + `@emotion/react` + `@emotion/styled` si se va a usar desde el día 1.
3. Reproducir **solo**: layout con un bloque “main” vacío + footer fijo con `<audio>` de prueba y un `useState` de volumen.
4. Comprobar que no hay errores de hidratación por `useWindowSize` (patrón: estado inicial fijo en servidor y actualización tras mount).

Resultado del spike: confirmar versiones de Next y React compatibles con la versión de MUI elegida (consultar matriz oficial MUI + Next).

## Referencias internas

- Inventario navegador: [PRE_MIGRATION_SSR_INVENTORY.md](./PRE_MIGRATION_SSR_INVENTORY.md)
- Contrato de datos: [DATA_CONTRACT.md](./DATA_CONTRACT.md)
- Player: [PLAYER_SURFACE.md](./PLAYER_SURFACE.md)
