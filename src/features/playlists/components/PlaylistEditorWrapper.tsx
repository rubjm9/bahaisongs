'use client';

import { PlaylistEditor } from './PlaylistEditor';

interface Props {
  playlistId: string;
  isOwner: boolean;
}

export function PlaylistEditorWrapper({ playlistId, isOwner }: Props) {
  return <PlaylistEditor playlistId={playlistId} isOwner={isOwner} />;
}
