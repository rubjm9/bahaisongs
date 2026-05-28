# Contenido, derechos y embeds (previo a storage masivo)

Este documento no es asesoramiento legal; recoge **criterios de producto y cumplimiento** que el equipo debe cerrar antes de subir audio/imágenes a Supabase Storage, publicar en producción o depender de YouTube.

## Audio y carátulas

1. **Titularidad y licencia**: cada pista y cada imagen deben tener licencia explícita para distribución en vuestra app (no basta con “está en internet”).
2. **Atribución**: acordar formato (créditos en ficha de canción, página “Agradecimientos”, enlace a fuente).
3. **Enlaces hotlink vs propio storage**: usar URLs de terceros sin permiso puede violar términos del host o generar roturas. El paso a **Storage propio** debe ir acompañado de permiso de almacenamiento/redistribución.
4. **Metadatos**: conservar en DB fuente, año, idioma y referencia legal si aplica (facilita auditorías).

## Letras y acordes

- Las letras suelen tener **derechos de autor** distintos del audio; tratarlas como contenido con la misma rigurosidad que la música.
- Si se permite edición colaborativa más adelante, definir quién es responsable del contenido publicado (moderación, historial de cambios).

## YouTube (embeds)

1. Revisar los [Términos de servicio de YouTube](https://www.youtube.com/static?template=terms) y la política de API/embed según uso (solo reproductor incrustado vs API de datos).
2. **No** descargar audio de YouTube para sustituir al `<audio>` propio salvo donde la ley y la licencia lo permitan explícitamente.
3. Embeds: usar iframe oficial; no enviar datos personales innecesarios al iframe; documentar en privacidad si hay cookies de terceros.

## Privacidad y métricas (Fase 5 del roadmap)

- Si se registran reproducciones, búsquedas o modo presentación: base legal (consentimiento / interés legítimo según jurisdicción), retención y posibilidad de opt-out.
- Datos de cuenta Supabase: política de privacidad enlazada desde login.

## Checklist antes de “Storage y media”

- [ ] Lista de obras con licencia o autorización documentada.
- [ ] Política de uso de imágenes de stock (Unsplash, etc.) acorde a sus términos.
- [ ] Decisión sobre YouTube: ¿solo complemento informativo o fuente principal? ¿En qué páginas?
- [ ] Texto legal mínimo: aviso legal + privacidad (aunque sea borrador interno) antes de abrir registro público.

## Responsable

Designar una persona o comité que apruebe nuevas subidas a Storage y cambios en el catálogo.
