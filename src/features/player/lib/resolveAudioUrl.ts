/**
 * Resuelve la URL de reproducción para una pista.
 * - URLs legacy (https://…) se usan directamente.
 * - Claves R2 (audio/{uuid}/legacy.mp3) pasan por la Edge Function sign-audio-url.
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const res = await fetch(
    `${supabaseUrl}/functions/v1/sign-audio-url?track=${encodeURIComponent(slug)}`,
    { headers: { Authorization: `Bearer ${anonKey}` } },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as SignAudioResponse;
  signedUrlCache.set(slug, {
    url: data.url,
    expiresAt: new Date(data.expiresAt).getTime(),
  });
  return data.url;
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
