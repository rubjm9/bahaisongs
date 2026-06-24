import type { SyncedLyricLine } from '@/entities/lyrics';
import type { MappedLyrics, TranscriptionResult } from './types';

export function mapToLyrics(result: TranscriptionResult): MappedLyrics {
  const syncedJson: SyncedLyricLine[] = result.segments.map((segment, index) => {
    const next = result.segments[index + 1];
    return {
      startTime: segment.start,
      endTime: next ? next.start : segment.end,
      text: segment.text,
      line: index,
    };
  });

  const bodyPlain = result.text.trim() || syncedJson.map((line) => line.text).join('\n');

  return { bodyPlain, syncedJson };
}
