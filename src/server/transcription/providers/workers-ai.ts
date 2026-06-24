import { parseVtt } from '../parseVtt';
import type { AiBinding, TranscriptionResult } from '../types';

const WHISPER_MODEL = '@cf/openai/whisper-large-v3-turbo';

function bufferToAudioArray(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer));
}

async function runWhisper(
  ai: AiBinding,
  audio: ArrayBuffer,
  language?: string,
): Promise<TranscriptionResult> {
  const response = await ai.run(WHISPER_MODEL, {
    audio: bufferToAudioArray(audio),
    ...(language ? { language } : {}),
  });

  const text = (response.text ?? '').trim();
  const segments = response.vtt ? parseVtt(response.vtt) : [];

  if (segments.length === 0 && text) {
    return { text, segments: [{ start: 0, end: 0, text }] };
  }

  return { text: text || segments.map((s) => s.text).join(' '), segments };
}

async function runWhisperRest(
  audio: ArrayBuffer,
  language?: string,
): Promise<TranscriptionResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.R2_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error('Workers AI no disponible: faltan bindings o CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${WHISPER_MODEL}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: bufferToAudioArray(audio),
        ...(language ? { language } : {}),
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Workers AI error ${response.status}: ${detail}`);
  }

  const json = (await response.json()) as {
    result?: { text?: string; vtt?: string };
    text?: string;
    vtt?: string;
  };

  const result = json.result ?? json;
  const text = (result.text ?? '').trim();
  const segments = result.vtt ? parseVtt(result.vtt) : [];

  if (segments.length === 0 && text) {
    return { text, segments: [{ start: 0, end: 0, text }] };
  }

  return { text: text || segments.map((s) => s.text).join(' '), segments };
}

export async function transcribeWithWorkersAi(
  audio: ArrayBuffer,
  opts: { ai?: AiBinding; language?: string } = {},
): Promise<TranscriptionResult> {
  if (opts.ai) {
    return runWhisper(opts.ai, audio, opts.language);
  }
  return runWhisperRest(audio, opts.language);
}

/**
 * Merge chunk transcriptions, shifting segment timestamps by each chunk offset.
 */
export function mergeChunkResults(
  chunks: { offsetSeconds: number; result: TranscriptionResult }[],
): TranscriptionResult {
  const segments = chunks.flatMap(({ offsetSeconds, result }) =>
    result.segments.map((segment) => ({
      start: segment.start + offsetSeconds,
      end: segment.end + offsetSeconds,
      text: segment.text,
    })),
  );

  return {
    text: chunks.map((c) => c.result.text).join(' ').trim(),
    segments,
  };
}
