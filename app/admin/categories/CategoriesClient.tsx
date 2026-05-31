'use client';

import { useState, useTransition } from 'react';
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '@/features/admin/components/DataTable';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { categorySchema, type CategoryFormValues } from '@/features/admin/lib/schemas';
import { createCategory, updateCategory, deleteCategory } from '@/features/admin/actions/categories';
import { cssVars, accent, radii } from '@/shared/theme/tokens';

interface CategoryRow {
  id: string;
  slug: string;
  name_es: string;
  name_en: string;
  kind: string;
}

const KIND_LABELS: Record<string, string> = {
  genre: 'Género',
  mood: 'Atmósfera',
  theme: 'Tema',
  tag: 'Etiqueta',
};

const KIND_COLORS: Record<string, string> = {
  genre: accent.electric,
  mood: accent.cyan,
  theme: accent.indigo,
  tag: '#34D399',
};

interface Props {
  initialCategories: CategoryRow[];
}

export function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { slug: '', name_es: '', name_en: '', kind: 'genre' },
  });

  function openCreate() {
    setEditingCategory(null);
    reset({ slug: '', name_es: '', name_en: '', kind: 'genre' });
    setDialogOpen(true);
    setError(null);
  }

  function openEdit(cat: CategoryRow) {
    setEditingCategory(cat);
    reset({ slug: cat.slug, name_es: cat.name_es, name_en: cat.name_en, kind: cat.kind as CategoryFormValues['kind'] });
    setDialogOpen(true);
    setError(null);
  }

  function onSubmit(values: CategoryFormValues) {
    startTransition(async () => {
      try {
        setError(null);
        if (editingCategory) {
          await updateCategory(editingCategory.id, values);
          setCategories((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? { ...c, ...values } : c)),
          );
        } else {
          const created = await createCategory(values);
          setCategories((prev) => [...prev, created]);
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
      try {
        await deleteCategory(deleteTarget.id);
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al eliminar');
        setDeleteTarget(null);
      }
    });
  }

  const columns: Column<CategoryRow>[] = [
    {
      key: 'kind',
      label: 'Tipo',
      width: 110,
      render: (row) => (
        <Chip
          label={KIND_LABELS[row.kind] ?? row.kind}
          size="small"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 600,
            height: 22,
            background: `${KIND_COLORS[row.kind] ?? cssVars.borderStrong}20`,
            color: KIND_COLORS[row.kind] ?? cssVars.textMuted,
            border: `1px solid ${KIND_COLORS[row.kind] ?? cssVars.borderStrong}40`,
          }}
        />
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      width: 160,
      render: (row) => (
        <Typography variant="body2" sx={{ color: cssVars.textMuted, fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {row.slug}
        </Typography>
      ),
    },
    { key: 'name_es', label: 'Nombre ES', render: (row) => row.name_es },
    { key: 'name_en', label: 'Nombre EN', render: (row) => row.name_en },
    {
      key: 'actions',
      label: '',
      width: 80,
      align: 'right',
      render: (row) => (
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => openEdit(row)} aria-label="Editar categoría">
              <Pencil size={15} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              onClick={() => setDeleteTarget(row)}
              aria-label="Eliminar categoría"
              sx={{ color: 'error.main' }}
            >
              <Trash2 size={15} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: cssVars.textPrimary }}>
          {categories.length} categorías
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={openCreate}
          sx={{ borderRadius: `${radii.pill}px` }}
        >
          Nueva categoría
        </Button>
      </Stack>

      <DataTable
        columns={columns}
        rows={categories}
        rowKey={(r) => r.id}
        loading={isPending && categories.length === 0}
        emptyMessage="No hay categorías todavía"
      />

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2.5}>
              {error && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${radii.md}px`,
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    color: 'error.main',
                    fontSize: '0.875rem',
                  }}
                >
                  {error}
                </Box>
              )}
              <Controller
                name="kind"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Tipo"
                    error={!!errors.kind}
                    helperText={errors.kind?.message}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="genre">Género</MenuItem>
                    <MenuItem value="mood">Atmósfera</MenuItem>
                    <MenuItem value="theme">Tema</MenuItem>
                    <MenuItem value="tag">Etiqueta</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Slug"
                    placeholder="ejemplo-slug"
                    error={!!errors.slug}
                    helperText={errors.slug?.message ?? 'Minúsculas, números y guiones'}
                    size="small"
                    fullWidth
                  />
                )}
              />
              <Controller
                name="name_es"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre en español"
                    error={!!errors.name_es}
                    helperText={errors.name_es?.message}
                    size="small"
                    fullWidth
                  />
                )}
              />
              <Controller
                name="name_en"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre en inglés"
                    error={!!errors.name_en}
                    helperText={errors.name_en?.message}
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined" disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={isPending}>
              {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar categoría"
        description={`¿Eliminar la categoría «${deleteTarget?.name_es}»? Esta acción eliminará también sus asociaciones a canciones.`}
        confirmLabel="Eliminar"
        destructive
        loading={isPending}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
