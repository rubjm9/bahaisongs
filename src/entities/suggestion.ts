import type { TrackSourceKind } from './track';

export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface SuggestionPayload {
  title: string;
  artistName?: string;
  language: string;
  lyricsChordPro?: string;
  hasChords: boolean;
  categorySlugs: string[];
  source: {
    kind: TrackSourceKind;
    /** R2 incoming path when kind === 'mp3_r2'; YouTube URL when 'youtube'. */
    ref: string;
  };
  notes?: string;
}

export interface Suggestion {
  id: string;
  submittedBy: string;
  status: SuggestionStatus;
  payload: SuggestionPayload;
  uploadPath?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
