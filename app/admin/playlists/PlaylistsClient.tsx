'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus, Pencil, Trash2, ListMusic } from 'lucide-react';
import { DataTable, type Column } from '@/features/admin/components/DataTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { playlistSchema, type PlaylistFormValues } from '@/features/admin/lib/schemas';
import { createCuratedPlaylist, updatePlaylist, deletePlaylist } from '@/features/admin/actions/playlists';
import type { AdminPlaylistRow } from '@/server/data/playlists';
import { cssVars, accent, radii } from '@/shared/theme/tokens';

type FilterTab = 'all' | 'curated' | 'user';

const VISIBILITY_LABELS: Record<string, string> = { public: 'Pública', private: 'Privada', unlisted: 'No listada' };

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface Props {
  initialPlaylists: AdminPlaylistRow[];
}

export function PlaylistsClient({ initialPlaylists }: Props) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPlaylistRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPlaylistRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: { slug: '', title: '', description: '', visibility: 'public' },
  });

  const filteredPlaylists = useMemo(() => {
    if (filter === 'curated') return playlists.filter((p) => p.is_curated);
    if (filter === 'user') return playlists.filter((p) => !p.is_curated);
    return playlists;
  }, [playlists, filter]);

  const curatedCount = playlists.filter((p) => p.is_curated).length;
  const userCount = playlists.filter((p) => !p.is_curated).length;

  function openCreate() {
    setEditing(null);
    reset({ slug: '', title: '', description: '', visibility: 'public' });
    setDialogOpen(true);
    setError(null);
  }

  function openEdit(p: AdminPlaylistRow) {
    setEditing(p);
    reset({ slug: p.slug, title: p.title, description: p.description ?? '', visibility: p.visibility as PlaylistFormValues['visibility'] });
    setDialogOpen(true);
    setError(null);
  }

  function onSubmit(values: PlaylistFormValues) {
    startTransition(async () => {
      try {
        setError(null);
        if (editing) {
          await updatePlaylist(editing.id, values);
          setPlaylists((prev) =>
            prev.map((p): AdminPlaylistRow =>
              p.id === editing.id
                ? { ...p, slug: values.slug, title: values.title, description: values.description ?? null, visibility: values.visibility }
                : p,
            ),
          );
        } else {
          const created = await createCuratedPlaylist(values);
          const newPlaylist: AdminPlaylistRow = {
            id: created?.id ?? crypto.randomUUID(),
            slug: values.slug,
            title: values.title,
            description: values.description ?? null,
            visibility: values.visibility,
            is_curated: true,
            owner_id: null,
            owner_display_name: null,
            updated_at: new Date().toISOString(),
            _track_count: 0,
          };
          setPlaylists((prev) => [newPlaylist, ...prev]);
        }
        setDialogOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      }
    });
  }

  function onDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deletePlaylist(deleteTarget.id);
      setPlaylists((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    });
  }

  const columns: Column<AdminPlaylistRow>[] = [
    {
      key: 'title',
      label: 'Título',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.title}</Typography>
          <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>{row.slug}</Typography>
        </Box>
      ),
    },
    {
      key: 'origin',
      label: 'Origen',
      width: 100,
      render: (row) => (
        <Chip
          label={row.is_curated ? 'Curada' : 'Usuario'}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: 22,
            fontWeight: 600,
            background: row.is_curated ? `${accent.cyan}18` : `${accent.electric}14`,
            color: row.is_curated ? accent.cyan : accent.electric,
          }}
        />
      ),
    },
    {
      key: 'owner',
      label: 'Propietario',
      width: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: cssVars.textMuted }}>
          {row.is_curated ? '—' : (row.owner_display_name ?? 'Sin nombre')}
        </Typography>
      ),
    },
    {
      key: 'tracks',
      label: 'Canciones',
      width: 100,
      align: 'center',
      render: (row) => (
        <Chip
          label={row._track_count}
          size="small"
          icon={<ListMusic size={12} />}
          sx={{ fontSize: '0.72rem', height: 22 }}
        />
      ),
    },
    {
      key: 'visibility',
      label: 'Visibilidad',
      width: 110,
      render: (row) => (
        <Chip
          label={VISIBILITY_LABELS[row.visibility] ?? row.visibility}
          size="small"
          sx={{
            fontSize: '0.7rem',
            height: 22,
            fontWeight: 600,
            background: row.visibility === 'public' ? `${accent.electric}18` : `${cssVars.borderStrong}18`,
            color: row.visibility === 'public' ? accent.electric : cssVars.textMuted,
          }}
        />
      ),
    },
    {
      key: 'updated',
      label: 'Actualizada',
      width: 110,
      render: (row) => (
        <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
          {formatDate(row.updated_at)}
        </Typography>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 100,
      align: 'right',
      render: (row) => (
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Editar pistas">
            <IconButton size="small" component={Link} href={`/admin/playlists/${row.id}`} aria-label="Editar pistas">
              <ListMusic size={15} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar info">
            <IconButton size="small" onClick={() => openEdit(row)} aria-label="Editar playlist">
              <Pencil size={15} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" onClick={() => setDeleteTarget(row)} aria-label="Eliminar playlist" sx={{ color: 'error.main' }}>
              <Trash2 size={15} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: cssVars.textPrimary }}>
            {playlists.length} playlists
          </Typography>
          <Typography variant="body2" sx={{ color: cssVars.textMuted, mt: 0.5 }}>
            {curatedCount} curadas · {userCount} de usuarios
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate} sx={{ borderRadius: `${radii.pill}px`, alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          Nueva playlist
        </Button>
      </Stack>

      <Tabs
        value={filter}
        onChange={(_, value: FilterTab) => setFilter(value)}
        sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontSize: '0.85rem' } }}
      >
        <Tab label={`Todas (${playlists.length})`} value="all" />
        <Tab label={`Curadas (${curatedCount})`} value="curated" />
        <Tab label={`De usuarios (${userCount})`} value="user" />
      </Tabs>

      <DataTable columns={columns} rows={filteredPlaylists} rowKey={(r) => r.id} emptyMessage="Sin playlists todavía" />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar playlist' : 'Nueva playlist'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2.5}>
              {error && <Box sx={{ p: 1.5, borderRadius: `${radii.md}px`, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'error.main', fontSize: '0.875rem' }}>{error}</Box>}
              <Controller name="title" control={control} render={({ field }) => (
                <TextField {...field} label="Título" error={!!errors.title} helperText={errors.title?.message} size="small" fullWidth />
              )} />
              <Controller name="slug" control={control} render={({ field }) => (
                <TextField {...field} label="Slug" error={!!errors.slug} helperText={errors.slug?.message} size="small" fullWidth />
              )} />
              <Controller name="description" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label="Descripción (opcional)" multiline minRows={2} size="small" fullWidth />
              )} />
              <Controller name="visibility" control={control} render={({ field }) => (
                <TextField {...field} select label="Visibilidad" size="small" fullWidth>
                  <MenuItem value="public">Pública</MenuItem>
                  <MenuItem value="unlisted">No listada</MenuItem>
                  <MenuItem value="private">Privada</MenuItem>
                </TextField>
              )} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined" disabled={isPending}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isPending}>{editing ? 'Guardar cambios' : 'Crear playlist'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar playlist"
        description={`¿Eliminar la playlist «${deleteTarget?.title}»?`}
        confirmLabel="Eliminar"
        destructive
        loading={isPending}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
