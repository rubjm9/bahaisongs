/**
 * Resuelve la URL de reproducción para una pista.
 * - URLs legacy (https://…) se usan directamente.
 * - Claves R2 (audio/{uuid}/legacy.mp3) pasan por `/api/audio/sign`.
 */

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/** Margen de 5 min antes de expirar para renovar la URL firmada. */
const RENEW_MARGIN_MS = 5 * 60 * 1000;

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

interface SignAudioResponse {
  url: string;
  expiresAt: string;
}

export async function fetchSignedAudioUrl(slug: string): Promise<string | null> {
  const cached = signedUrlCache.get(slug);
  if (cached && cached.expiresAt > Date.now() + RENEW_MARGIN_MS) {
    return cached.url;
  }

  const signUrl = `/api/audio/sign?track=${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(signUrl);
    if (!res.ok) return null;

    const data = (await res.json()) as SignAudioResponse;
    signedUrlCache.set(slug, {
      url: data.url,
      expiresAt: new Date(data.expiresAt).getTime(),
    });
    return data.url;
  } catch {
    return null;
  }
}

/**
 * Convierte el valor de audioUrl del catálogo en una URL reproducible.
 * Devuelve null si no hay fuente disponible.
 */
export async function resolvePlaybackUrl(
  slug: string,
  audioUrl: string | undefined,
): Promise<string | null> {
  if (!audioUrl) return null;
  if (isHttpUrl(audioUrl)) return audioUrl;
  return fetchSignedAudioUrl(slug);
}

/** Limpia la caché (útil en tests). */
export function clearSignedUrlCache(): void {
  signedUrlCache.clear();
}
