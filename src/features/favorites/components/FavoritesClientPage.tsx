'use client';

import { FavoritesPage } from './FavoritesPage';

interface Track {
  slug: string;
  title: string;
  artist?: string;
}

interface Props {
  allTracks?: Track[];
}

export function FavoritesClientPage({ allTracks = [] }: Props) {
  return <FavoritesPage allTracks={allTracks} />;
}
