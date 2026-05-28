export interface SyncedLyricLine {
  /** Inclusive start time, seconds. */
  startTime: number;
  /** End time hint; the active-line algorithm uses next.startTime, this is for UI grouping. */
  endTime: number;
  /** Visible text of the line. */
  text: string;
  /** Optional grouping index for multi-segment lines. */
  line?: number;
}

export interface Lyrics {
  id: string;
  trackId: string;
  locale: string;
  /** ChordPro source. Single source of truth for both display and editing. */
  bodyChordPro?: string;
  /** Denormalised plain text (chords stripped). Used for search. */
  bodyPlain: string;
  /** When present, enables the synced "follow" mode in the lyrics view. */
  syncedJson?: SyncedLyricLine[];
  hasChords: boolean;
  source?: 'wordpress' | 'admin' | 'suggestion';
}
