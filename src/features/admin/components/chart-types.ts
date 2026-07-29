export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  points: ChartPoint[];
}

export interface StackedChartMonth {
  label: string;
  segments: { key: string; label: string; value: number; color: string }[];
}

export interface RankedTrack {
  id: string;
  slug: string;
  title: string;
  count: number;
}

export interface CatalogGaps {
  drafts: number;
  withoutAudio: number;
  withoutLyrics: number;
  withoutChords: number;
  youtubeOnly: number;
  mp3Only: number;
}

export interface PlaylistLikeStats {
  totalPlaylists: number;
  publicPlaylists: number;
  unlistedPlaylists: number;
  privatePlaylists: number;
  totalLikes: number;
  likesLast30Days: number;
  playlistsByMonth: ChartPoint[];
}
