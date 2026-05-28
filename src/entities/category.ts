export type CategoryKind = 'genre' | 'mood' | 'theme' | 'tag';

export interface Category {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  kind: CategoryKind;
}
