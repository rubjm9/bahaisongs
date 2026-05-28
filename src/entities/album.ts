export interface Album {
  id: string;
  slug: string;
  title: string;
  year?: number;
  coverPath?: string;
  artistId?: string;
}
