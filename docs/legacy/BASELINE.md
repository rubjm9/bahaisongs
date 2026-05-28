# Baseline de calidad (previo a migración Next / Zustand / Supabase)

Registro para comparar después de cada fase mayor. Actualizar fecha y comandos al repetir la medición.

## Cómo reproducir

```bash
cd /path/to/bahaispoti
CI=true npm test
npm run build
```

## Última verificación registrada

| Comando            | Resultado                                       |
| ------------------ | ----------------------------------------------- |
| `CI=true npm test` | 4 suites, 19 tests, **OK** (Jest + `next/jest`) |
| `npm run build`    | **OK** (`next build`; avisos ESLint, sin error) |

### Bundle (Next.js 14)

Tras `next build`, el informe de rutas muestra **First Load JS** compartido ~**87.7 kB** y páginas típicas ~**139–147 kB** según ruta (no es el mismo desglose que CRA; comparar con informes posteriores).

### Avisos de build (ESLint)

Siguen apareciendo warnings (`no-img-element`, hooks, accesibilidad en algunas imágenes). No bloquean el build; conviene irlos reduciendo.

## Lighthouse (opcional)

1. `npm run build && npm start` (producción local en el puerto que indique Next, por defecto 3000).
2. Lighthouse en Chrome o CLI contra esa URL.

Guardar informe HTML o puntuaciones en una subcarpeta `docs/baseline-reports/` si el equipo lo usa.

## Rama y congelación

Para alinear con “rama por hito”: etiquetar commit o rama (`baseline/pre-next`) cuando este baseline sea el acuerdo del equipo tras revisar los docs en `docs/`.
