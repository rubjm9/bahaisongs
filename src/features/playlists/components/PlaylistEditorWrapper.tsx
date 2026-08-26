'use client';

import { PlaylistEditor } from './PlaylistEditor';

interface Props {
  playlistId: string;
  playlistSlug: string;
  isOwner: boolean;
}

export function PlaylistEditorWrapper({ playlistId, playlistSlug, isOwner }: Props) {
  return <PlaylistEditor playlistId={playlistId} playlistSlug={playlistSlug} isOwner={isOwner} />;
}
