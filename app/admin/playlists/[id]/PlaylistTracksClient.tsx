'use client';

import { useState, useTransition } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
import { GripVertical, Trash2, Plus, Save } from 'lucide-react';
import { setPlaylistTracks } from '@/features/admin/actions/playlists';
import { cssVars, radii } from '@/shared/theme/tokens';

interface TrackRef { id: string; slug: string; title: string; artistName: string | null }

interface Props {
  playlistId: string;
  currentTracks: TrackRef[];
  allTracks: TrackRef[];
}

function SortableTrackRow({
  track,
  index,
  onRemove,
}: {
  track: TrackRef;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        border: `1px solid ${cssVars.borderSubtle}`,
        borderRadius: `${radii.md}px`,
        background: isDragging ? cssVars.bgGlass : cssVars.bgElevated,
        transform: CSS.Transform.toString(transform),
        transition: [transition, 'background 160ms'].filter(Boolean).join(', '),
        opacity: isDragging ? 0.8 : 1,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{ color: cssVars.textMuted, cursor: 'grab', lineHeight: 0, touchAction: 'none', flexShrink: 0 }}
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical size={16} />
      </Box>
      <Typography variant="caption" sx={{ color: cssVars.textMuted, width: 24, textAlign: 'right', flexShrink: 0 }}>
        {index + 1}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{track.title}</Typography>
        {track.artistName && (
          <Typography variant="caption" sx={{ color: cssVars.textMuted }}>{track.artistName}</Typography>
        )}
      </Box>
      <IconButton size="small" onClick={() => onRemove(track.id)} aria-label="Quitar pista" sx={{ color: 'error.main', flexShrink: 0 }}>
        <Trash2 size={14} />
      </IconButton>
    </Box>
  );
}

export function PlaylistTracksClient({ playlistId, currentTracks, allTracks }: Props) {
  const [tracks, setTracks] = useState<TrackRef[]>(currentTracks);
  const [addTrack, setAddTrack] = useState<TrackRef | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const available = allTracks.filter((t) => !tracks.some((ct) => ct.id === t.id));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = tracks.findIndex((t) => t.id === active.id);
    const newIdx = tracks.findIndex((t) => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    setTracks(arrayMove(tracks, oldIdx, newIdx));
    setSaved(false);
  }

  function handleRemove(id: string) {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    setSaved(false);
  }

  function handleAdd() {
    if (!addTrack) return;
    setTracks((prev) => [...prev, addTrack]);
    setAddTrack(null);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await setPlaylistTracks(playlistId, tracks.map((t) => t.id));
      setSaved(true);
    });
  }

  return (
    <Stack spacing={3}>
      {/* Add track */}
      <Box
        sx={{
          p: 2,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: `${radii.lg}px`,
          background: cssVars.bgElevated,
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Añadir canción</Typography>
        <Stack direction="row" spacing={1.5}>
          <Autocomplete
            options={available}
            getOptionLabel={(t) => `${t.title}${t.artistName ? ` — ${t.artistName}` : ''}`}
            value={addTrack}
            onChange={(_, v) => setAddTrack(v)}
            renderInput={({ InputLabelProps: _ilp, ...params }) => <TextField {...params} placeholder="Buscar canción…" size="small" />}
            sx={{ flex: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<Plus size={15} />}
            onClick={handleAdd}
            disabled={!addTrack}
            sx={{ flexShrink: 0 }}
          >
            Añadir
          </Button>
        </Stack>
      </Box>

      {/* Sorted list */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {tracks.length} canciones
          </Typography>
          <Button
            variant="contained"
            startIcon={<Save size={15} />}
            onClick={handleSave}
            disabled={isPending}
            sx={{ borderRadius: `${radii.pill}px` }}
            color={saved ? 'success' : 'primary'}
          >
            {saved ? 'Guardado' : 'Guardar orden'}
          </Button>
        </Stack>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <Stack spacing={0.75}>
              {tracks.map((track, idx) => (
                <SortableTrackRow key={track.id} track={track} index={idx} onRemove={handleRemove} />
              ))}
              {tracks.length === 0 && (
                <Typography variant="body2" sx={{ color: cssVars.textMuted, py: 4, textAlign: 'center' }}>
                  Sin canciones. Añade alguna desde arriba.
                </Typography>
              )}
            </Stack>
          </SortableContext>
        </DndContext>
      </Box>
    </Stack>
  );
}
