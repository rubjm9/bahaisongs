# Configurar Cloudflare R2 para BahaiSongs

Guía paso a paso para crear el almacenamiento de audio e importar los MP3 del catálogo legacy.

## 1. Crear buckets en Cloudflare

1. Entra en [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2 Object Storage**.
2. Si es la primera vez, activa R2 (plan gratuito incluye 10 GB/mes).
3. Crea dos buckets **privados** (sin acceso público):

| Bucket | Nombre sugerido | Uso |
|--------|-----------------|-----|
| Audio | `bahaisongs-audio` | MP3 de canciones |
| Imágenes | `bahaisongs-images` | Portadas y avatares (fase posterior) |

> Los buckets deben ser **privados**. El navegador nunca accede a R2 directamente; las URLs firmadas las genera la Edge Function `sign-audio-url`.

## 2. Crear token de API R2

1. En R2 → **Manage R2 API Tokens** → **Create API token**.
2. Permisos: **Object Read & Write** en los buckets que creaste.
3. Guarda estos tres valores (solo se muestran una vez):

```
R2_ACCOUNT_ID=...        # aparece en la URL del dashboard R2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

## 3. Variables de entorno locales

Añade a `.env.local`:

```env
R2_ACCOUNT_ID=tu_account_id
R2_ACCESS_KEY_ID=tu_access_key
R2_SECRET_ACCESS_KEY=tu_secret_key
R2_BUCKET_AUDIO=bahaisongs-audio
R2_BUCKET_IMAGES=bahaisongs-images
```

Ya debes tener configuradas `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` para el ETL.

## 4. Migrar los MP3 a R2

El script descarga cada MP3 desde `canciones.bahai.es` y lo sube a R2 en `audio/{trackId}/legacy.mp3`. Es idempotente: puedes re-ejecutarlo sin duplicar.

```bash
# Solo audio (recomendado si ya importaste metadatos)
npm run etl:audio

# O el ETL completo (metadatos + audio)
npm run etl:wordpress
```

Salida esperada: ~82 MP3 migrados, algunos fallos posibles si la URL legacy ya no responde.

## 5. Desplegar la Edge Function de firma

La función `sign-audio-url` genera URLs temporales (1 h) para que el reproductor pueda reproducir audio privado.

```bash
# Configurar secretos en Supabase (solo una vez)
supabase secrets set \
  R2_ACCOUNT_ID=tu_account_id \
  R2_ACCESS_KEY_ID=tu_access_key \
  R2_SECRET_ACCESS_KEY=tu_secret_key \
  R2_BUCKET_AUDIO=bahaisongs-audio

# Desplegar la función
supabase functions deploy sign-audio-url
```

Prueba:

```bash
curl "https://TU_PROYECTO.supabase.co/functions/v1/sign-audio-url?track=oh-dios-guiame" \
  -H "Authorization: Bearer TU_ANON_KEY"
# → { "url": "https://...", "expiresAt": "..." }
```

## 6. Variables en Cloudflare Pages (producción)

En el dashboard de Cloudflare → **Workers & Pages** → tu proyecto → **Settings** → **Environment variables**, añade las mismas vars R2 **solo en server** (no expongas `R2_SECRET_ACCESS_KEY` como `NEXT_PUBLIC_*`):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_AUDIO`
- `R2_BUCKET_IMAGES`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (necesaria para el panel admin: conteos de reproducciones y operaciones privilegiadas)

En **Bindings**, vincula también:
- **Workers AI** → binding `AI`
- **R2 bucket** `bahaisongs-audio` → binding `AUDIO_BUCKET`

Los secretos de la Edge Function de firma se configuran en Supabase, no en Cloudflare Pages.

## 7. Verificar

```sql
-- En Supabase SQL Editor
select count(*) from track_sources where kind = 'mp3_r2';
-- esperado: ~82
```

En la app: abre una canción con audio y pulsa reproducir. Si la Edge Function está desplegada, el reproductor obtendrá una URL firmada automáticamente.

## Estructura de objetos en R2

```
bahaisongs-audio/
  audio/{track-uuid}/legacy.mp3
```

Cada fila en `track_sources` guarda la clave (`source_ref`), nunca la URL completa.
