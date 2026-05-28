/**
 * Supabase database types — hand-crafted from the migrations in supabase/migrations/.
 *
 * Run `npm run db:types` against a running local/cloud project to regenerate
 * this from the live schema. Until then these types provide full editor support.
 */

export type UserRole = 'user' | 'admin';
export type TrackSourceKind = 'mp3_r2' | 'youtube';
export type CategoryKind = 'genre' | 'mood' | 'theme' | 'tag';
export type PlaylistVisibility = 'public' | 'private' | 'unlisted';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type TrackArtistRole = 'lead' | 'feat' | 'composer' | 'arranger';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_path: string | null;
          role: UserRole;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_path?: string | null;
          role?: UserRole;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_path?: string | null;
          role?: UserRole;
          locale?: string;
          updated_at?: string;
        };
      };
      artists: {
        Row: {
          id: string;
          slug: string;
          name: string;
          bio: string | null;
          country: string | null;
          avatar_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          bio?: string | null;
          country?: string | null;
          avatar_path?: string | null;
        };
        Update: {
          slug?: string;
          name?: string;
          bio?: string | null;
          country?: string | null;
          avatar_path?: string | null;
          updated_at?: string;
        };
      };
      albums: {
        Row: {
          id: string;
          slug: string;
          title: string;
          year: number | null;
          cover_path: string | null;
          artist_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          year?: number | null;
          cover_path?: string | null;
          artist_id?: string | null;
        };
        Update: {
          slug?: string;
          title?: string;
          year?: number | null;
          cover_path?: string | null;
          artist_id?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_es: string;
          name_en: string;
          kind: CategoryKind;
        };
        Insert: {
          id?: string;
          slug: string;
          name_es: string;
          name_en: string;
          kind: CategoryKind;
        };
        Update: {
          slug?: string;
          name_es?: string;
          name_en?: string;
          kind?: CategoryKind;
        };
      };
      tracks: {
        Row: {
          id: string;
          slug: string;
          title: string;
          duration_seconds: number | null;
          language: string;
          album_id: string | null;
          primary_artist_id: string | null;
          cover_path: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          search_tsv: unknown;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          duration_seconds?: number | null;
          language?: string;
          album_id?: string | null;
          primary_artist_id?: string | null;
          cover_path?: string | null;
          published_at?: string | null;
        };
        Update: {
          slug?: string;
          title?: string;
          duration_seconds?: number | null;
          language?: string;
          album_id?: string | null;
          primary_artist_id?: string | null;
          cover_path?: string | null;
          published_at?: string | null;
          updated_at?: string;
        };
      };
      track_sources: {
        Row: {
          id: string;
          track_id: string;
          kind: TrackSourceKind;
          source_ref: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          kind: TrackSourceKind;
          source_ref: string;
          is_primary?: boolean;
        };
        Update: {
          kind?: TrackSourceKind;
          source_ref?: string;
          is_primary?: boolean;
        };
      };
      track_artists: {
        Row: {
          track_id: string;
          artist_id: string;
          role: TrackArtistRole;
          position: number;
        };
        Insert: {
          track_id: string;
          artist_id: string;
          role?: TrackArtistRole;
          position?: number;
        };
        Update: {
          role?: TrackArtistRole;
          position?: number;
        };
      };
      track_categories: {
        Row: {
          track_id: string;
          category_id: string;
        };
        Insert: {
          track_id: string;
          category_id: string;
        };
        Update: Record<string, never>;
      };
      lyrics: {
        Row: {
          id: string;
          track_id: string;
          locale: string;
          body_chordpro: string | null;
          body_plain: string | null;
          synced_json: unknown;
          has_chords: boolean;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          locale: string;
          body_chordpro?: string | null;
          body_plain?: string | null;
          synced_json?: unknown;
          has_chords?: boolean;
          source?: string | null;
        };
        Update: {
          body_chordpro?: string | null;
          body_plain?: string | null;
          synced_json?: unknown;
          has_chords?: boolean;
          source?: string | null;
          updated_at?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          visibility: PlaylistVisibility;
          owner_id: string | null;
          cover_path: string | null;
          is_curated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          visibility?: PlaylistVisibility;
          owner_id?: string | null;
          cover_path?: string | null;
          is_curated?: boolean;
        };
        Update: {
          slug?: string;
          title?: string;
          description?: string | null;
          visibility?: PlaylistVisibility;
          owner_id?: string | null;
          cover_path?: string | null;
          is_curated?: boolean;
          updated_at?: string;
        };
      };
      playlist_tracks: {
        Row: {
          playlist_id: string;
          position: number;
          track_id: string;
          added_at: string;
        };
        Insert: {
          playlist_id: string;
          position: number;
          track_id: string;
        };
        Update: {
          position?: number;
          track_id?: string;
        };
      };
      likes: {
        Row: {
          user_id: string;
          track_id: string;
          liked_at: string;
        };
        Insert: {
          user_id: string;
          track_id: string;
        };
        Update: Record<string, never>;
      };
      play_events: {
        Row: {
          id: string;
          user_id: string | null;
          track_id: string;
          played_at: string;
          completion: number | null;
          source: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          track_id: string;
          played_at?: string;
          completion?: number | null;
          source?: string | null;
        };
        Update: {
          completion?: number | null;
        };
      };
      suggestions: {
        Row: {
          id: string;
          submitted_by: string;
          status: SuggestionStatus;
          payload: Record<string, unknown>;
          upload_path: string | null;
          review_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submitted_by: string;
          status?: SuggestionStatus;
          payload: Record<string, unknown>;
          upload_path?: string | null;
          review_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: {
          status?: SuggestionStatus;
          payload?: Record<string, unknown>;
          upload_path?: string | null;
          review_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      track_source_kind: TrackSourceKind;
      category_kind: CategoryKind;
      playlist_visibility: PlaylistVisibility;
      suggestion_status: SuggestionStatus;
      track_artist_role: TrackArtistRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
