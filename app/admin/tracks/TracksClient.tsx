'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Plus, Pencil, Trash2, Search, Volume2, Guitar, AlignLeft } from 'lucide-react';
import { DataTable, type Column } from '@/features/admin/components/DataTable';
import { TableHeaderFilter } from '@/features/admin/components/TableHeaderFilter';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { deleteTrack } from '@/features/admin/actions/tracks';
import {
  TRACK_LANGUAGES,
  trackLanguageLabels,
} from '@/features/catalog/lib/track-languages';
import { cssVars, accent, radii } from '@/shared/theme/tokens';

interface TrackRow {
  id: string;
  slug: string;
  title: string;
  language: string;
  published_at: string | null;
  primary_artist_id: string | null;
  artists: { name: string } | null;
  _count_sources: number;
  _has_chords: boolean;
  _has_lyrics: boolean;
  _play_count: number;
}

const LANGUAGE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  ...TRACK_LANGUAGES.map((code) => ({
    value: code,
    label: trackLanguageLabels[code],
  })),
];

const CONTENT_FILTER_OPTIONS = [
  { value: 'audio', label: 'Con audio' },
  { value: 'chords', label: 'Con acordes' },
  { value: 'lyrics', label: 'Con letra' },
];

interface Props {
  initialTracks: TrackRow[];
  categories: { id: string; slug: string; name_es: string; kind: string }[];
  artists: { id: string; name: string; slug: string }[];
}

export function TracksClient({ initialTracks }: Props) {
  const [tracks, setTracks] = useState(initialTracks);
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [contentFilters, setContentFilters] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<TrackRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasActiveFilters =
    search.trim().length > 0 || languageFilter !== 'all' || contentFilters.length > 0;

  const filtered = useMemo(() => {
    let list = tracks;

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.slug.includes(query) ||
          (t.artists?.name ?? '').toLowerCase().includes(query),
      );
    }

    if (languageFilter !== 'all') {
      list = list.filter((t) => t.language === languageFilter);
    }

    if (contentFilters.includes('audio')) {
      list = list.filter((t) => t._count_sources > 0);
    }
    if (contentFilters.includes('chords')) {
      list = list.filter((t) => t._has_chords);
    }
    if (contentFilters.includes('lyrics')) {
      list = list.filter((t) => t._has_lyrics);
    }

    return list;
  }, [tracks, search, languageFilter, contentFilters]);

  function onDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteTrack(deleteTarget.id, deleteTarget.slug);
      setTracks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    });
  }

  const columns: Column<TrackRow>[] = useMemo(
    () => [
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      sortValue: (row) => row.title,
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, color: cssVars.textPrimary }}>
            {row.title}
          </Typography>
          <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
            {row.artists?.name ?? '—'}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      width: 160,
      sortable: true,
      sortValue: (row) => row.slug,
      render: (row) => (
        <Typography variant="caption" sx={{ color: cssVars.textMuted, fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {row.slug}
        </Typography>
      ),
    },
    {
      key: 'lang',
      label: 'Idioma',
      width: 90,
      align: 'center',
      header: (
        <TableHeaderFilter
          label="Idioma"
          value={languageFilter}
          options={LANGUAGE_FILTER_OPTIONS}
          onChange={setLanguageFilter}
        />
      ),
      render: (row) => (
        <Chip
          label={row.language.toUpperCase()}
          size="small"
          sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }}
        />
      ),
    },
    {
      key: 'flags',
      label: 'Contenido',
      width: 108,
      align: 'center',
      header: (
        <TableHeaderFilter
          mode="multi"
          label="Contenido"
          values={contentFilters}
          options={CONTENT_FILTER_OPTIONS}
          onChange={setContentFilters}
        />
      ),
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Tooltip title="Con audio">
            <Box sx={{ color: row._count_sources > 0 ? accent.cyan : cssVars.borderStrong, lineHeight: 0 }}>
              <Volume2 size={14} />
            </Box>
          </Tooltip>
          <Tooltip title="Con acordes">
            <Box sx={{ color: row._has_chords ? accent.electric : cssVars.borderStrong, lineHeight: 0 }}>
              <Guitar size={14} />
            </Box>
          </Tooltip>
          <Tooltip title="Con letra">
            <Box sx={{ color: row._has_lyrics ? accent.glow : cssVars.borderStrong, lineHeight: 0 }}>
              <AlignLeft size={14} />
            </Box>
          </Tooltip>
        </Stack>
      ),
    },
    {
      key: 'plays',
      label: 'Reproducciones',
      width: 110,
      align: 'right',
      sortable: true,
      sortValue: (row) => row._play_count,
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            color: row._play_count > 0 ? cssVars.textPrimary : cssVars.textMuted,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {row._play_count.toLocaleString('es')}
        </Typography>
      ),
    },
    {
      key: 'published',
      label: 'Publicada',
      width: 110,
      sortable: true,
      sortValue: (row) => row.published_at,
      render: (row) =>
        row.published_at ? (
          <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
            {new Date(row.published_at).toLocaleDateString('es')}
          </Typography>
        ) : (
          <Chip
            label="Borrador"
            size="small"
            sx={{
              fontSize: '0.65rem',
              height: 20,
              background: 'rgba(245,158,11,0.15)',
              color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          />
        ),
    },
    {
      key: 'actions',
      label: '',
      width: 80,
      align: 'right',
      render: (row) => (
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              component={Link}
              href={`/admin/tracks/${row.id}`}
              aria-label="Editar canción"
            >
              <Pencil size={15} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              onClick={() => setDeleteTarget(row)}
              aria-label="Eliminar canción"
              sx={{ color: 'error.main' }}
            >
              <Trash2 size={15} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ],
    [languageFilter, contentFilters],
  );

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: cssVars.textPrimary }}>
            {filtered.length}
            {hasActiveFilters ? ` de ${tracks.length}` : ''} canciones
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <TextField
            size="small"
            placeholder="Buscar por título o artista…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 260 },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                '& fieldset': { borderColor: cssVars.borderSubtle },
                '&:hover fieldset': { borderColor: cssVars.borderStrong },
                '&.Mui-focused fieldset': { borderColor: accent.electric },
              },
              '& .MuiOutlinedInput-input': {
                color: '#0D1F3C',
                '&::placeholder': { color: '#5A7399', opacity: 1 },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={15} style={{ color: cssVars.textMuted }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            component={Link}
            href="/admin/tracks/new"
            sx={{ borderRadius: `${radii.pill}px`, flexShrink: 0 }}
          >
            Nueva canción
          </Button>
        </Stack>
      </Stack>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        loading={false}
        defaultSortKey="title"
        defaultSortDirection="asc"
        emptyMessage={hasActiveFilters ? 'Sin resultados con estos filtros' : 'No hay canciones todavía'}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar canción"
        description={`¿Eliminar «${deleteTarget?.title}»? Se eliminarán también sus letras, fuentes y categorías.`}
        confirmLabel="Eliminar"
        destructive
        loading={isPending}
        onConfirm={onDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
