'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '@/features/admin/components/DataTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { artistSchema, type ArtistFormValues } from '@/features/admin/lib/schemas';
import { createArtist, updateArtist, deleteArtist } from '@/features/admin/actions/artists';
import { cssVars, radii } from '@/shared/theme/tokens';

interface ArtistRow { id: string; slug: string; name: string; bio: string | null; country: string | null }

interface Props {
  initialArtists: ArtistRow[];
}

export function ArtistsClient({ initialArtists }: Props) {
  const [artists, setArtists] = useState(initialArtists);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ArtistRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArtistRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ArtistFormValues>({
    resolver: zodResolver(artistSchema),
    defaultValues: { slug: '', name: '', bio: '', country: '' },
  });

  function openCreate() {
    setEditing(null);
    reset({ slug: '', name: '', bio: '', country: '' });
    setDialogOpen(true);
    setError(null);
  }

  function openEdit(artist: ArtistRow) {
    setEditing(artist);
    reset({ slug: artist.slug, name: artist.name, bio: artist.bio ?? '', country: artist.country ?? '' });
    setDialogOpen(true);
    setError(null);
  }

  function onSubmit(values: ArtistFormValues) {
    startTransition(async () => {
      try {
        setError(null);
        if (editing) {
          await updateArtist(editing.id, values);
          setArtists((prev) =>
            prev.map((a): ArtistRow =>
              a.id === editing.id
                ? { ...a, slug: values.slug, name: values.name, bio: values.bio ?? null, country: values.country ?? null }
                : a,
            ),
          );
        } else {
          const created = await createArtist(values);
          const newArtist: ArtistRow = {
            id: created?.id ?? crypto.randomUUID(),
            slug: values.slug,
            name: values.name,
            bio: values.bio ?? null,
            country: values.country ?? null,
          };
          setArtists((prev) => [...prev, newArtist]);
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
      await deleteArtist(deleteTarget.id);
      setArtists((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    });
  }

  const columns: Column<ArtistRow>[] = [
    { key: 'name', label: 'Nombre', render: (row) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.name}</Typography> },
    { key: 'slug', label: 'Slug', width: 200, render: (row) => <Typography variant="caption" sx={{ fontFamily: 'monospace', color: cssVars.textMuted, fontSize: '0.75rem' }}>{row.slug}</Typography> },
    { key: 'country', label: 'País', width: 100, render: (row) => row.country ?? '—' },
    {
      key: 'actions', label: '', width: 80, align: 'right',
      render: (row) => (
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(row)} aria-label="Editar artista"><Pencil size={15} /></IconButton></Tooltip>
          <Tooltip title="Eliminar"><IconButton size="small" onClick={() => setDeleteTarget(row)} aria-label="Eliminar artista" sx={{ color: 'error.main' }}><Trash2 size={15} /></IconButton></Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: cssVars.textPrimary }}>{artists.length} artistas</Typography>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={openCreate} sx={{ borderRadius: `${radii.pill}px` }}>
          Nuevo artista
        </Button>
      </Stack>

      <DataTable columns={columns} rows={artists} rowKey={(r) => r.id} emptyMessage="No hay artistas todavía" />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar artista' : 'Nuevo artista'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2.5}>
              {error && <Box sx={{ p: 1.5, borderRadius: `${radii.md}px`, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'error.main', fontSize: '0.875rem' }}>{error}</Box>}
              <Controller name="name" control={control} render={({ field }) => (
                <TextField {...field} label="Nombre" error={!!errors.name} helperText={errors.name?.message} size="small" fullWidth />
              )} />
              <Controller name="slug" control={control} render={({ field }) => (
                <TextField {...field} label="Slug" error={!!errors.slug} helperText={errors.slug?.message ?? 'Solo minúsculas, números y guiones'} size="small" fullWidth />
              )} />
              <Controller name="country" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label="País (opcional)" size="small" fullWidth />
              )} />
              <Controller name="bio" control={control} render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label="Biografía (opcional)" multiline minRows={3} size="small" fullWidth />
              )} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined" disabled={isPending}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={isPending}>{editing ? 'Guardar cambios' : 'Crear artista'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar artista"
        description={`¿Eliminar a «${deleteTarget?.name}»? Las canciones asociadas quedarán sin artista principal.`}
        confirmLabel="Eliminar"
        destructive
        loading={isPending}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
