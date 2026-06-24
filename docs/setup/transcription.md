# Transcripción de letras desde MP3

Guía para transcribir letras automáticamente desde los MP3 almacenados en R2.

## Arquitectura

- **Admin (bajo demanda):** botón "Transcribir desde MP3" en el editor de pista. Usa Cloudflare Workers AI (`@cf/openai/whisper-large-v3-turbo`) leyendo el audio directamente desde R2.
- **Backfill (batch):** script CLI con Whisper local (`faster-whisper` o `whisper` CLI) para procesar el catálogo completo sin límites de cuota.

Ambos flujos generan:
- `lyrics.body_plain` — texto para búsqueda y edición
- `lyrics.synced_json` — líneas con `startTime` / `endTime` para el modo "seguir reproducción"
- `lyrics.source = 'transcription'` — marca el origen automático

Siempre revisa el borrador en admin antes de publicar.

## Requisitos en Cloudflare Pages

En `wrangler.toml` (ya configurado):

```toml
[ai]
binding = "AI"

[[r2_buckets]]
binding = "AUDIO_BUCKET"
bucket_name = "bahaisongs-audio"
```

En el dashboard de Pages → **Bindings**, verifica que `AI` y `AUDIO_BUCKET` estén vinculados.

Variables de entorno en Pages (además de las de R2 y Supabase):

| Variable | Uso |
|---|---|
| `R2_BUCKET_AUDIO` | Fallback cuando no hay binding R2 |
| `CLOUDFLARE_ACCOUNT_ID` | Fallback REST API en desarrollo local |
| `CLOUDFLARE_API_TOKEN` | Fallback REST API en desarrollo local |
| `GROQ_API_KEY` | Fallback opcional si Workers AI falla |

## Uso en admin

1. Abre una pista con fuente `mp3_r2` en `/admin/tracks/[id]`.
2. Pestaña **Letra** → **Transcribir desde MP3**.
3. Revisa el texto y guarda.

## Backfill local

Instala Whisper local (recomendado: faster-whisper):

```bash
pip install faster-whisper
# o: pip install openai-whisper
```

Ejecuta:

```bash
# Vista previa sin escribir en la base de datos
npm run etl:transcribe:dry

# Transcribir pistas sin letra existente
npm run etl:transcribe

# Forzar re-transcripción
npm run etl:transcribe -- --force

# Probar con pocas pistas
npm run etl:transcribe -- --limit 3
```

Requiere `.env.local` con credenciales de Supabase (service role) y R2.

## Limitaciones conocidas

- Whisper está entrenado con voz hablada; el canto con instrumentación puede dar resultados imprecisos.
- MP3 muy largos (>24 MB) en admin deben procesarse con el script local de backfill.
- La separación de voz (Demucs) no está implementada; es una mejora futura opcional.

## Modo karaoke en la app pública

Cuando `synced_json` está presente, `LyricsViewer` muestra el botón **Seguir reproducción**, que resalta la línea activa según la posición del reproductor.
