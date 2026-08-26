'use client';

import { Box, IconButton, Stack, CircularProgress } from '@mui/material';
import { GripVertical, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cssVars, radii } from '@/shared/theme/tokens';
import { PlayButton } from '@/features/player/components/PlayButton';
import { toPlayableList } from '@/features/player/lib/playable';
import type { PlayableTrack } from '@/features/player/lib/types';
import { usePlaylistTracks } from '../hooks/usePlaylistTracks';
import type { PlaylistEntry } from '@/entities/playlist';
import { isTrackLanguage } from '@/features/catalog/lib/track-languages';

function noop() {
  return undefined;
}

function buildPlaylistQueue(tracks: readonly PlaylistEntry[]): PlayableTrack[] {
  return toPlayableList(
    tracks.map((e) => ({
      id: e.track.id,
      slug: e.track.slug,
      title: e.track.title,
      artist: e.track.primaryArtistName ?? '',
      artistSlug: e.track.slug,
      language: isTrackLanguage(e.track.language) ? e.track.language : 'es',
    })),
  );
}

interface Props {
  playlistId: string;
  playlistSlug: string;
  isOwner: boolean;
}

export function PlaylistEditor({ playlistId, playlistSlug, isOwner }: Props) {
  const t = useTranslations('playlist');
  const { tracks, loading, removeTrack, reorderTracks } = usePlaylistTracks(playlistId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tracks.findIndex((t) => (t.track.id || t.track.slug) === active.id);
    const newIndex = tracks.findIndex((t) => (t.track.id || t.track.slug) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tracks, oldIndex, newIndex);
    await reorderTracks(reordered.map((e) => e.track.id || e.track.slug));
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (tracks.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: cssVars.textMuted, fontSize: '0.9rem' }}>
        {t('emptyPlaylists')}
      </Box>
    );
  }

  const queue = buildPlaylistQueue(tracks);
  const playSource = `playlist:${playlistSlug}`;

  if (!isOwner) {
    return (
      <Stack spacing={0.5}>
        {tracks.map((entry, idx) => (
          <TrackItem
            key={entry.track.id || entry.track.slug}
            entry={entry}
            index={idx}
            isOwner={false}
            onRemove={noop}
            queue={queue}
            queueIndex={idx}
            playSource={playSource}
          />
        ))}
      </Stack>
    );
  }

  const ids = tracks.map((e) => e.track.id || e.track.slug);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <Stack spacing={0.5}>
          {tracks.map((entry, idx) => (
            <SortableTrackItem
              key={entry.track.id || entry.track.slug}
              entry={entry}
              index={idx}
              onRemove={() => removeTrack(entry.track.id || entry.track.slug)}
              queue={queue}
              playSource={playSource}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
}

function TrackItem({
  entry,
  index,
  isOwner,
  onRemove,
  dragHandle,
  queue,
  queueIndex,
  playSource,
}: {
  entry: PlaylistEntry;
  index: number;
  isOwner: boolean;
  onRemove: () => void;
  dragHandle?: React.ReactNode;
  queue?: readonly PlayableTrack[];
  queueIndex?: number;
  playSource?: string;
}) {
  const t = useTranslations('playlist');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1.5,
        borderRadius: `${radii.sm}px`,
        background: cssVars.bgGlass,
        border: `1px solid ${cssVars.borderSubtle}`,
        '&:hover': { borderColor: cssVars.borderStrong },
        transition: 'border-color 160ms',
      }}
    >
      {dragHandle}
      <Box sx={{ color: cssVars.textMuted, fontSize: '0.78rem', minWidth: 24 }}>{index + 1}</Box>
      {queue && typeof queueIndex === 'number' ? (
        <PlayButton
          track={queue[queueIndex]!}
          queue={queue}
          queueIndex={queueIndex}
          {...(playSource ? { source: playSource } : {})}
          size={28}
          variant="ghost"
        />
      ) : null}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            fontWeight: 600,
            fontSize: '0.9rem',
            color: cssVars.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.track.title || entry.track.slug}
        </Box>
        {entry.track.primaryArtistName ? (
          <Box sx={{ fontSize: '0.78rem', color: cssVars.textMuted }}>
            {entry.track.primaryArtistName}
          </Box>
        ) : null}
      </Box>
      {isOwner ? (
        <IconButton
          size="small"
          onClick={onRemove}
          aria-label={t('removeTrack')}
          sx={{ color: cssVars.textMuted, '&:hover': { color: '#ef4444' } }}
        >
          <Trash2 size={14} />
        </IconButton>
      ) : null}
    </Box>
  );
}

function SortableTrackItem({
  entry,
  index,
  onRemove,
  queue,
  playSource,
}: {
  entry: PlaylistEntry;
  index: number;
  onRemove: () => void;
  queue: readonly PlayableTrack[];
  playSource: string;
}) {
  const id = entry.track.id || entry.track.slug;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  const dragHandle = (
    <Box
      {...attributes}
      {...listeners}
      sx={{
        cursor: 'grab',
        color: cssVars.textMuted,
        display: 'flex',
        alignItems: 'center',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <GripVertical size={16} />
    </Box>
  );

  return (
    <Box ref={setNodeRef} style={style}>
      <TrackItem
        entry={entry}
        index={index}
        isOwner={true}
        onRemove={onRemove}
        dragHandle={dragHandle}
        queue={queue}
        queueIndex={index}
        playSource={playSource}
      />
    </Box>
  );
}
