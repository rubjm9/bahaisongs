import type { TranscriptionSegment } from './types';

function parseTimestamp(value: string): number {
  const parts = value.trim().split(':');
  if (parts.length === 3) {
    const [h, m, rest] = parts;
    const [s, ms = '0'] = rest!.split('.');
    return (
      Number(h) * 3600 +
      Number(m) * 60 +
      Number(s) +
      Number(ms.padEnd(3, '0').slice(0, 3)) / 1000
    );
  }
  if (parts.length === 2) {
    const [m, rest] = parts;
    const [s, ms = '0'] = rest!.split('.');
    return Number(m) * 60 + Number(s) + Number(ms.padEnd(3, '0').slice(0, 3)) / 1000;
  }
  return 0;
}

/**
 * Parse a WebVTT string (as returned by Workers AI Whisper) into timed segments.
 */
export function parseVtt(vtt: string): TranscriptionSegment[] {
  const lines = vtt.replace(/^\uFEFF/, '').split(/\r?\n/);
  const segments: TranscriptionSegment[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const cuePattern =
      /^(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)/;
    const match = cuePattern.exec(line);
    if (!match) continue;

    const start = parseTimestamp(match[1]!);
    const end = parseTimestamp(match[2]!);
    const textLines: string[] = [];

    while (i + 1 < lines.length) {
      const next = lines[i + 1] ?? '';
      if (!next.trim()) break;
      if (next.includes('-->')) break;
      i++;
      textLines.push(next.trim());
    }

    const text = textLines.join(' ').trim();
    if (text) segments.push({ start, end, text });
  }

  return segments;
}
