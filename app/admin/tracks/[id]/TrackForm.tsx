'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Save, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  trackMetaSchema,
  lyricsEditorSchema,
  categorySchema,
  type TrackMetaFormValues,
  type LyricsEditorFormValues,
  type CategoryFormValues,
} from '@/features/admin/lib/schemas';
import { createTrack, updateTrack, upsertLyrics, updateTrackCategories } from '@/features/admin/actions/tracks';
import { createCategory } from '@/features/admin/actions/categories';
import { deriveHasChords } from '@/shared/lib/chord-detection';
import { formatDuration, probeAudioDuration } from '@/shared/lib/audio-duration';
import { cssVars, radii } from '@/shared/theme/tokens';

const ChordProEditorPanel = dynamic(
  () => import('@/features/admin/components/ChordProEditorPanel').then((m) => ({ default: m.ChordProEditorPanel })),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ color: cssVars.textMuted }}>Cargando editor…</Typography>
      </Box>
    ),
  },
);

interface Category { id: string; slug: string; name_es: string; kind: string }
interface Artist { id: string; name: string; slug: string }

interface Props {
  track: { id: string; slug: string; title: string; language: string; published_at: string | null; primary_artist_id: string | null; duration_seconds: number | null } | null;
  trackCategories: string[];
  trackLyrics: { locale: string; body_plain: string | null; body_chordpro: string | null; has_chords: boolean } | null;
  trackSources: { id: string; kind: string; source_ref: string; is_primary: boolean }[];
  categories: Category[];
  artists: Artist[];
}

const KIND_LABELS: Record<string, string> = { genre: 'Género', mood: 'Atmósfera', theme: 'Tema', tag: 'Etiqueta' };

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function fromDateInputValue(date: string): string | null {
  if (!date) return null;
  return `${date}T00:00:00.000Z`;
}

function autoSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function TrackForm({ track, trackCategories, trackLyrics, trackSources, categories: initialCategories, artists }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(trackCategories);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [durationDetecting, setDurationDetecting] = useState(false);
  const [categoryDialogKind, setCategoryDialogKind] = useState<CategoryFormValues['kind'] | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const metaForm = useForm<TrackMetaFormValues>({
    resolver: zodResolver(trackMetaSchema),
    defaultValues: {
      title: track?.title ?? '',
      slug: track?.slug ?? '',
      language: track?.language ?? 'es',
      published_at: track?.published_at ?? null,
      primary_artist_id: track?.primary_artist_id ?? null,
      duration_seconds: track?.duration_seconds ?? null,
    },
  });

  const lyricsForm = useForm<LyricsEditorFormValues>({
    resolver: zodResolver(lyricsEditorSchema),
    defaultValues: {
      body_plain: trackLyrics?.body_plain ?? '',
      body_chordpro: trackLyrics?.body_chordpro ?? '',
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { slug: '', name_es: '', name_en: '', kind: 'genre' },
  });

  const bodyPlain = lyricsForm.watch('body_plain');
  const bodyChordpro = lyricsForm.watch('body_chordpro');
  const hasChordsDetected = useMemo(
    () => deriveHasChords(bodyPlain, bodyChordpro),
    [bodyPlain, bodyChordpro],
  );

  const handleChordProChange = useCallback(
    (val: string) => lyricsForm.setValue('body_chordpro', val, { shouldDirty: true }),
    [lyricsForm],
  );
  const handlePlainChange = useCallback(
    (val: string) => lyricsForm.setValue('body_plain', val, { shouldDirty: true }),
    [lyricsForm],
  );

  const durationSeconds = metaForm.watch('duration_seconds');

  const groupedCategories = categories.reduce<Record<string, Category[]>>((acc, cat) => {
    (acc[cat.kind] ??= []).push(cat);
    return acc;
  }, {});

  useEffect(() => {
    if (durationSeconds) return;

    const primary = trackSources.find((s) => s.is_primary) ?? trackSources[0];
    if (!primary?.kind || primary.kind !== 'mp3_r2') return;
    if (!/^https?:\/\//i.test(primary.source_ref)) return;

    setDurationDetecting(true);
    void probeAudioDuration(primary.source_ref)
      .then((seconds) => {
        if (seconds) metaForm.setValue('duration_seconds', seconds);
      })
      .finally(() => setDurationDetecting(false));
  }, [trackSources, durationSeconds, metaForm]);

  function openCategoryDialog(kind: CategoryFormValues['kind']) {
    setCategoryError(null);
    categoryForm.reset({ slug: '', name_es: '', name_en: '', kind });
    setCategoryDialogKind(kind);
  }

  function onCreateCategory(values: CategoryFormValues) {
    startTransition(async () => {
      try {
        setCategoryError(null);
        const created = await createCategory(values);
        setCategories((prev) => [...prev, created]);
        setSelectedCategories((prev) => [...prev, created.id]);
        setCategoryDialogKind(null);
      } catch (e) {
        setCategoryError(e instanceof Error ? e.message : 'Error al crear categoría');
      }
    });
  }

  function onSave() {
    void metaForm.handleSubmit((metaValues) => {
      startTransition(async () => {
        try {
          setError(null);
          const lyricsValues = lyricsForm.getValues();
          const lyricsPayload = {
            locale: metaValues.language,
            body_plain: lyricsValues.body_plain,
            body_chordpro: lyricsValues.body_chordpro,
            has_chords: deriveHasChords(lyricsValues.body_plain, lyricsValues.body_chordpro),
          };

          const metaPayload = {
            ...metaValues,
            published_at: metaValues.published_at
              ? fromDateInputValue(toDateInputValue(metaValues.published_at))
              : null,
          };

          if (track) {
            await updateTrack(track.id, metaPayload);
            await updateTrackCategories(track.id, selectedCategories);
            if (lyricsPayload.body_plain || lyricsPayload.body_chordpro) {
              await upsertLyrics(track.id, lyricsPayload);
            }
          } else {
            await createTrack(metaPayload, selectedCategories, lyricsPayload);
          }

          router.push('/admin/tracks');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Error al guardar');
        }
      });
    })();
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Button
          component={Link}
          href="/admin/tracks"
          startIcon={<ArrowLeft size={16} />}
          variant="outlined"
          size="small"
          sx={{ borderRadius: `${radii.pill}px` }}
        >
          Volver
        </Button>
        <Button
          variant="contained"
          startIcon={<Save size={16} />}
          onClick={onSave}
          disabled={isPending}
          sx={{ borderRadius: `${radii.pill}px` }}
        >
          {track ? 'Guardar cambios' : 'Crear canción'}
        </Button>
      </Stack>

      {error && (
        <Box
          sx={{
            mb: 2,
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

      <Box
        sx={{
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: `${radii.lg}px`,
          background: cssVars.bgElevated,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v as number)}
          sx={{ borderBottom: `1px solid ${cssVars.borderSubtle}`, px: 2 }}
        >
          <Tab label="Metadatos" />
          <Tab label="Categorías" />
          <Tab label="Letra" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Stack spacing={2.5} sx={{ maxWidth: 640 }}>
              <Controller
                name="title"
                control={metaForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Título"
                    error={!!metaForm.formState.errors.title}
                    helperText={metaForm.formState.errors.title?.message}
                    size="small"
                    fullWidth
                    onChange={(e) => {
                      field.onChange(e);
                      if (!track) metaForm.setValue('slug', autoSlug(e.target.value));
                    }}
                  />
                )}
              />
              <Controller
                name="slug"
                control={metaForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Slug"
                    error={!!metaForm.formState.errors.slug}
                    helperText={metaForm.formState.errors.slug?.message ?? 'URL única de la canción'}
                    size="small"
                    fullWidth
                  />
                )}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="language"
                  control={metaForm.control}
                  render={({ field }) => (
                    <TextField {...field} select label="Idioma" size="small" sx={{ minWidth: 140 }}>
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="pt">Português</MenuItem>
                    </TextField>
                  )}
                />
                <Controller
                  name="published_at"
                  control={metaForm.control}
                  render={({ field }) => (
                    <TextField
                      value={toDateInputValue(field.value)}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      label="Fecha de publicación"
                      type="date"
                      size="small"
                      sx={{ flex: 1 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Stack>
              <Controller
                name="primary_artist_id"
                control={metaForm.control}
                render={({ field }) => (
                  <Autocomplete
                    options={artists}
                    getOptionLabel={(a) => a.name}
                    value={artists.find((a) => a.id === field.value) ?? null}
                    onChange={(_, v) => field.onChange(v?.id ?? null)}
                    renderInput={({ InputLabelProps: _ilp, ...params }) => (
                      <TextField {...params} label="Artista principal" size="small" />
                    )}
                  />
                )}
              />
              <Box>
                <Typography variant="body2" sx={{ color: cssVars.textPrimary, fontWeight: 500, mb: 0.5 }}>
                  Duración
                </Typography>
                <Typography variant="body2" sx={{ color: cssVars.textMuted, lineHeight: 1.6 }}>
                  {durationDetecting
                    ? 'Detectando duración desde el audio…'
                    : durationSeconds
                      ? formatDuration(durationSeconds)
                      : 'Sin duración detectada'}
                </Typography>
                <Typography variant="caption" sx={{ color: cssVars.textMuted, display: 'block', mt: 0.75 }}>
                  Se obtiene automáticamente desde la fuente MP3 cuando hay una URL directa disponible.
                </Typography>
              </Box>
            </Stack>
          )}

          {activeTab === 1 && (
            <Box>
              {Object.entries(groupedCategories).map(([kind, cats]) => (
                <Box key={kind} sx={{ mb: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: cssVars.textMuted, fontSize: '0.7rem', letterSpacing: '0.08em', mb: 1.5, display: 'block' }}
                  >
                    {KIND_LABELS[kind] ?? kind}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    {cats.map((cat) => {
                      const selected = selectedCategories.includes(cat.id);
                      return (
                        <Chip
                          key={cat.id}
                          label={cat.name_es}
                          onClick={() =>
                            setSelectedCategories((prev) =>
                              selected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id],
                            )
                          }
                          variant={selected ? 'filled' : 'outlined'}
                          color={selected ? 'primary' : 'default'}
                          sx={{ cursor: 'pointer' }}
                        />
                      );
                    })}
                    <Tooltip title={`Nueva ${(KIND_LABELS[kind] ?? kind).toLowerCase()}`}>
                      <IconButton
                        size="small"
                        aria-label={`Agregar ${KIND_LABELS[kind] ?? kind}`}
                        onClick={() => openCategoryDialog(kind as CategoryFormValues['kind'])}
                        sx={{
                          width: 32,
                          height: 32,
                          color: cssVars.textMuted,
                          border: `1px dashed ${cssVars.borderSubtle}`,
                          borderRadius: `${radii.pill}px`,
                          '&:hover': { color: cssVars.textPrimary, borderColor: cssVars.borderStrong, background: cssVars.hoverSubtle },
                        }}
                      >
                        <Plus size={16} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Divider sx={{ mt: 2.5 }} />
                </Box>
              ))}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: cssVars.textMuted, lineHeight: 1.6 }}>
                  El idioma de la letra coincide con el idioma definido en metadatos.
                  {hasChordsDetected
                    ? ' Acordes detectados automáticamente.'
                    : ' No se detectaron acordes en el texto ChordPro.'}
                </Typography>
              </Box>
              <ChordProEditorPanel
                value={bodyChordpro ?? ''}
                onChange={handleChordProChange}
                plainText={bodyPlain ?? ''}
                onPlainTextChange={handlePlainChange}
              />
            </Box>
          )}
        </Box>
      </Box>

      <Dialog
        open={categoryDialogKind !== null}
        onClose={() => setCategoryDialogKind(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Nueva {categoryDialogKind ? (KIND_LABELS[categoryDialogKind] ?? categoryDialogKind).toLowerCase() : 'categoría'}
        </DialogTitle>
        <form onSubmit={categoryForm.handleSubmit(onCreateCategory)}>
          <DialogContent>
            <Stack spacing={2.5}>
              {categoryError && (
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
                  {categoryError}
                </Box>
              )}
              <Controller
                name="name_es"
                control={categoryForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre en español"
                    error={!!categoryForm.formState.errors.name_es}
                    helperText={categoryForm.formState.errors.name_es?.message}
                    size="small"
                    fullWidth
                    onChange={(e) => {
                      field.onChange(e);
                      categoryForm.setValue('slug', autoSlug(e.target.value));
                      categoryForm.setValue('name_en', e.target.value);
                    }}
                  />
                )}
              />
              <Controller
                name="name_en"
                control={categoryForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre en inglés"
                    error={!!categoryForm.formState.errors.name_en}
                    helperText={categoryForm.formState.errors.name_en?.message}
                    size="small"
                    fullWidth
                  />
                )}
              />
              <Controller
                name="slug"
                control={categoryForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Slug"
                    error={!!categoryForm.formState.errors.slug}
                    helperText={categoryForm.formState.errors.slug?.message ?? 'Minúsculas, números y guiones'}
                    size="small"
                    fullWidth
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setCategoryDialogKind(null)} variant="outlined" disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={isPending}>
              Crear
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
