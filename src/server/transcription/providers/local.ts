import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { TranscriptionResult } from '../types';

const execFileAsync = promisify(execFile);

interface WhisperJsonSegment {
  start: number;
  end: number;
  text: string;
}

interface WhisperJsonOutput {
  text?: string;
  segments?: WhisperJsonSegment[];
}

async function runCommand(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(command, args, { maxBuffer: 20 * 1024 * 1024 });
}

function parseWhisperJson(raw: string): TranscriptionResult {
  const json = JSON.parse(raw) as WhisperJsonOutput;
  const segments = (json.segments ?? []).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));

  const text = (json.text ?? '').trim() || segments.map((s) => s.text).join(' ');
  return { text, segments };
}

/**
 * Transcribe audio using a local Whisper CLI.
 * Tries `faster-whisper` first, then OpenAI `whisper`.
 */
export async function transcribeWithLocalCli(
  audio: ArrayBuffer,
  language?: string,
): Promise<TranscriptionResult> {
  const dir = await mkdtemp(join(tmpdir(), 'bahaisongs-transcribe-'));
  const inputPath = join(dir, 'audio.mp3');

  try {
    await writeFile(inputPath, Buffer.from(audio));

    const langFlag = language ? ['--language', language] : [];

    try {
      const { stdout } = await runCommand('faster-whisper', [
        inputPath,
        '--model',
        'base',
        '--output_format',
        'json',
        '--output_dir',
        dir,
        ...langFlag,
      ]);
      const jsonPath = join(dir, 'audio.json');
      try {
        const raw = await readFile(jsonPath, 'utf8');
        return parseWhisperJson(raw);
      } catch {
        if (stdout.trim().startsWith('{')) return parseWhisperJson(stdout);
        throw new Error('faster-whisper no generó JSON de salida');
      }
    } catch {
      const { stdout } = await runCommand('whisper', [
        inputPath,
        '--model',
        'base',
        '--output_format',
        'json',
        '--output_dir',
        dir,
        ...langFlag,
      ]);
      const jsonPath = join(dir, 'audio.json');
      try {
        const raw = await readFile(jsonPath, 'utf8');
        return parseWhisperJson(raw);
      } catch {
        if (stdout.trim().startsWith('{')) return parseWhisperJson(stdout);
        throw new Error(
          'No se encontró faster-whisper ni whisper CLI. Instala con: pip install faster-whisper',
        );
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
