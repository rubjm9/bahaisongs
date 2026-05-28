import type { TrackPreview } from './track';

export type PlaylistVisibility = 'public' | 'private' | 'unlisted';

export interface Playlist {
  id: string;
  slug: string;
  title: string;
  description?: string;
  visibility: PlaylistVisibility;
  ownerId?: string;
  coverPath?: string;
  tracks: PlaylistEntry[];
}

export interface PlaylistEntry {
  position: number;
  addedAt: string;
  track: TrackPreview;
}
