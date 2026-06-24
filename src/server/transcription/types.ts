import type { SyncedLyricLine } from '@/entities/lyrics';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  segments: TranscriptionSegment[];
}

export interface MappedLyrics {
  bodyPlain: string;
  syncedJson: SyncedLyricLine[];
}

export interface AiBinding {
  run(
    model: string,
    inputs: { audio: number[]; language?: string },
  ): Promise<{ text?: string; vtt?: string; word_count?: number }>;
}

export interface R2ObjectBody {
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface R2BucketBinding {
  get(key: string): Promise<R2ObjectBody | null>;
}

export interface CloudflareBindings {
  AI?: AiBinding;
  AUDIO_BUCKET?: R2BucketBinding;
}
