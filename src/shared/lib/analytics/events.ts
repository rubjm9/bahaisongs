/** Typed GA4 event names and payloads for BahaiSongs. */

export type PlaySource = 'player' | 'search' | 'discover' | `playlist:${string}`;

export interface AnalyticsEventMap {
  play: {
    track_slug: string;
    source: PlaySource;
  };
  search: {
    search_term: string;
  };
  login: {
    method: string;
  };
  add_to_wishlist: {
    track_slug: string;
    action: 'add' | 'remove';
  };
  add_to_playlist: {
    track_slug: string;
    playlist_id: string;
  };
  share: {
    method: 'whatsapp';
    content_type: 'song' | 'page';
  };
  generate_lead: Record<string, never>;
  view_item: {
    item_id: string;
  };
  select_content: {
    content_type: 'track' | 'search_result';
    item_id: string;
  };
  locale_change: {
    from: string;
    to: string;
  };
  theme_change: {
    theme: string;
  };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

export type AnalyticsEventParams<E extends AnalyticsEventName> = AnalyticsEventMap[E];

export interface UserAnalyticsProperties {
  locale?: string;
  authenticated?: boolean;
}
