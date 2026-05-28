import type { Artist } from './artist';
import type { Category } from './category';

export type TrackSourceKind = 'mp3_r2' | 'youtube';

export interface TrackSource {
  id: string;
  kind: TrackSourceKind;
  /** R2 object key when kind === 'mp3_r2'; YouTube video id when kind === 'youtube' */
  sourceRef: string;
  isPrimary: boolean;
}

export interface Track {
  id: string;
  slug: string;
  title: string;
  durationSeconds?: number;
  language: string;
  albumId?: string;
  primaryArtistId?: string;
  coverPath?: string;
  publishedAt?: string;
  sources: TrackSource[];
  artists: Pick<Artist, 'id' | 'slug' | 'name'>[];
  categories: Pick<Category, 'id' | 'slug' | 'kind'>[];
}

/** Shape returned by list endpoints (minimal projection). */
export interface TrackPreview {
  id: string;
  slug: string;
  title: string;
  language: string;
  primaryArtistName?: string;
  hasChords: boolean;
  hasAudio: boolean;
  coverPath?: string;
}
