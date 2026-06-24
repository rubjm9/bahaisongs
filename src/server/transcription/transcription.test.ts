import { describe, expect, it } from 'vitest';
import { parseVtt } from './parseVtt';
import { mapToLyrics } from './mapToLyrics';

describe('parseVtt', () => {
  it('parses cue timestamps and text', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.500
Primera línea

00:00:03.500 --> 00:00:06.000
Segunda línea
`;

    expect(parseVtt(vtt)).toEqual([
      { start: 1, end: 3.5, text: 'Primera línea' },
      { start: 3.5, end: 6, text: 'Segunda línea' },
    ]);
  });
});

describe('mapToLyrics', () => {
  it('builds plain text and synced lines', () => {
    const mapped = mapToLyrics({
      text: 'Hola mundo',
      segments: [
        { start: 0, end: 1.2, text: 'Hola' },
        { start: 1.2, end: 2.4, text: 'mundo' },
      ],
    });

    expect(mapped.bodyPlain).toBe('Hola mundo');
    expect(mapped.syncedJson).toEqual([
      { startTime: 0, endTime: 1.2, text: 'Hola', line: 0 },
      { startTime: 1.2, endTime: 2.4, text: 'mundo', line: 1 },
    ]);
  });
});
