# Inventario SSR / navegador y layout (previo a Next.js)

Este documento lista APIs del navegador, almacenamiento local y la estructura de rutas/layout para planificar Client Components, layouts en Next y evitar ejecución en servidor donde no corresponde.

## Rutas actuales (`src/App.js`)

| Ruta                    | Página            |
| ----------------------- | ----------------- |
| `/`                     | Home              |
| `/search`               | Search            |
| `/library/*`            | Library           |
| `/playlist/:path`       | Playlist          |
| `/song/:songId`         | Song detail       |
| `/favorites`            | Favorites         |
| `/history`              | History           |
| `/presentation/:songId` | Presentation mode |

Todas vuelven dentro de `BrowserRouter` → `Suspense` → `Routes`; el **Footer** (reproductor) está **fuera** de `Routes`, por lo que es **global** a todas las rutas. Sidebar vs `MobileNavigation` según `useWindowSize` y `CONST.MOBILE_SIZE`.

## Layout compartido

- **Shell**: `div.layout` en `App.js` — Sidebar o navegación móvil + área de rutas + **Footer** fijo abajo.
- **Audio**: un solo `<audio>` en `Footer` → `Audio` (`src/component/footer/audio.js`) con `ref` en `footer.js`.
- **Implicación Next**: el layout raíz (`app/layout.tsx` o equivalente) debe montar **una vez** sidebar + `children` + footer/player; las rutas solo cambian el contenido central.

## `localStorage` (clave → uso)

| Clave                  | Archivo                              |
| ---------------------- | ------------------------------------ |
| `bahaisongs_theme`     | `src/store/slices/themeSlice.js`     |
| `bahaisongs_favorites` | `src/store/slices/favoritesSlice.js` |
| `bahaisongs_history`   | `src/store/slices/historySlice.js`   |

Todo el acceso está en slices o tests; en SSR hay que **inicializar estado por defecto** en servidor y **hidratar** en cliente (o marcar estos slices como solo cliente).

## `window` / `document` / `navigator` por archivo

### `window`

- `src/index.js` — `confirm`, `reload` (actualización SW).
- `src/hooks/useWindowSize.js` — `innerWidth` / `innerHeight`, `resize`.
- `src/hooks/useMousePosition.js` — `mousemove`.
- `src/store/slices/themeSlice.js` — `matchMedia('(prefers-color-scheme: light)')`.
- `src/utils/shareUtils.js` — `location.origin`.
- `src/utils/registerServiceWorker.js` — `hostname`, `location`, `addEventListener('load')`, `reload`.
- `src/component/footer/range-slider.js` — `getComputedStyle`.
- `src/pages/presentation-mode.js` — `mousemove` (mostrar UI), implícito con fullscreen en `document`.

### `document`

- `src/store/index.js` — `documentElement.setAttribute('data-theme', …)` en `subscribe` (tema).
- `src/store/slices/themeSlice.js` — `documentElement.setAttribute` al cambiar tema.
- `src/pages/playlist.js`, `src/component/cards/playlist-card-s.js` — `style.setProperty('--hover-home-bg', …)`.
- `src/component/sidebar/sidebar.js` — `addEventListener` / `removeEventListener` `mousemove` / `mouseup` (resize sidebar).
- `src/utils/shareUtils.js` — `createElement`, `body` / `head`, `execCommand('copy')` (fallback).
- `src/pages/presentation-mode.js` — Fullscreen API (`requestFullscreen`, `fullscreenElement`, `exitFullscreen`, `fullscreenchange`).
- `src/index.js` — `getElementById('root')` (entrada CRA; en Next será distinto).

### `navigator`

- `src/utils/registerServiceWorker.js` — `serviceWorker.register`, etc.
- `src/utils/shareUtils.js` — `share`, `clipboard`.
- `src/component/common/ShareButton.js` — comprobación `clipboard` / share.

### Guardas existentes

- `src/store/index.js` — `if (typeof window !== 'undefined')` antes de `initializeTheme`.
- `src/hooks/useWindowSize.js` — `typeof window === 'object'` para primer render.

## Service Worker

- Registro en `src/index.js` solo en `production`.
- URL esperada: `process.env.PUBLIC_URL + '/service-worker.js'` (patrón CRA post-build). En `public/` del repo **no** hay `service-worker.js` en fuente; lo genera el build de CRA cuando aplica.

## Resumen para migración Next

1. Cualquier módulo que toque `localStorage`, `document` o `window` en **carga de módulo** (no solo en hooks) debe vivir en **cliente** o tras comprobación `typeof window !== 'undefined'`.
2. El **store** que aplica `data-theme` en `subscribe` debe ejecutarse solo en cliente (equivalente a un `useEffect` en provider o store creado solo en cliente).
3. **Un layout** con footer global evita duplicar `<audio>` al navegar.
4. `process.env.PUBLIC_URL` debe sustituirse por convenciones Next (`basePath`, `assetPrefix` o rutas estáticas bajo `public/`).
