import type { TranscriptionResult } from '../types';

interface GroqVerboseSegment {
  start: number;
  end: number;
  text: string;
}

interface GroqVerboseResponse {
  text: string;
  segments?: GroqVerboseSegment[];
}

/**
 * Fallback transcription via Groq's OpenAI-compatible Whisper API.
 * Edge-compatible (plain fetch).
 */
export async function transcribeWithGroq(
  audio: ArrayBuffer,
  language?: string,
): Promise<TranscriptionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurada');
  }

  const blob = new Blob([audio], { type: 'audio/mpeg' });
  const form = new FormData();
  form.append('file', blob, 'audio.mp3');
  form.append('model', 'whisper-large-v3-turbo');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'segment');
  if (language) form.append('language', language);

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq error ${response.status}: ${detail}`);
  }

  const json = (await response.json()) as GroqVerboseResponse;
  const segments = (json.segments ?? []).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));

  return {
    text: (json.text ?? '').trim() || segments.map((s) => s.text).join(' '),
    segments,
  };
}
