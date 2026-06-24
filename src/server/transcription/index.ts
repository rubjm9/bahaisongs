import { signedGetUrl } from '@/shared/lib/r2/signing';
import { getCloudflareBindings } from './cloudflare-env';
import { mapToLyrics } from './mapToLyrics';
import { transcribeWithGroq } from './providers/groq';
import { transcribeWithWorkersAi } from './providers/workers-ai';
import type { AiBinding, CloudflareBindings, MappedLyrics } from './types';

export type { MappedLyrics, TranscriptionResult } from './types';
export { mapToLyrics } from './mapToLyrics';
export { parseVtt } from './parseVtt';

const MAX_SINGLE_PASS_BYTES = 24 * 1024 * 1024;

export async function loadAudioFromR2(
  sourceRef: string,
  bindings?: CloudflareBindings | null,
): Promise<ArrayBuffer> {
  const bucketBinding = bindings?.AUDIO_BUCKET;
  if (bucketBinding) {
    const object = await bucketBinding.get(sourceRef);
    if (!object) throw new Error(`Audio no encontrado en R2: ${sourceRef}`);
    return object.arrayBuffer();
  }

  const bucket = process.env.R2_BUCKET_AUDIO;
  if (!bucket) throw new Error('R2_BUCKET_AUDIO no configurado');

  const url = await signedGetUrl(bucket, sourceRef);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo descargar audio (${response.status})`);
  }
  return response.arrayBuffer();
}

export async function transcribeAudioBuffer(
  audio: ArrayBuffer,
  opts: { language?: string; bindings?: CloudflareBindings | null } = {},
): Promise<MappedLyrics> {
  if (audio.byteLength > MAX_SINGLE_PASS_BYTES) {
    throw new Error(
      `El audio supera ${MAX_SINGLE_PASS_BYTES} bytes. Usa el script de backfill local para pistas largas.`,
    );
  }

  const bindings = opts.bindings ?? (await getCloudflareBindings());
  const language = opts.language;

  try {
    const workersOpts: { ai?: AiBinding; language?: string } = {};
    if (bindings?.AI) workersOpts.ai = bindings.AI;
    if (language) workersOpts.language = language;
    const result = await transcribeWithWorkersAi(audio, workersOpts);
    return mapToLyrics(result);
  } catch (workersErr) {
    if (!process.env.GROQ_API_KEY) throw workersErr;
    const result = await transcribeWithGroq(audio, language);
    return mapToLyrics(result);
  }
}

export async function transcribeFromR2Key(
  sourceRef: string,
  opts: { language?: string } = {},
): Promise<MappedLyrics> {
  const bindings = await getCloudflareBindings();
  const audio = await loadAudioFromR2(sourceRef, bindings);
  return transcribeAudioBuffer(audio, { ...opts, bindings });
}
