'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { trackMetaSchema, lyricsSchema, type TrackMetaFormValues, type LyricsFormValues } from '@/features/admin/lib/schemas';
import { createTrack, updateTrack, upsertLyrics, updateTrackCategories } from '@/features/admin/actions/tracks';
import { cssVars, radii } from '@/shared/theme/tokens';

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

export function TrackForm({ track, trackCategories, trackLyrics, categories, artists }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(trackCategories);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  const lyricsForm = useForm<LyricsFormValues>({
    resolver: zodResolver(lyricsSchema),
    defaultValues: {
      locale: trackLyrics?.locale ?? 'es',
      body_plain: trackLyrics?.body_plain ?? '',
      body_chordpro: trackLyrics?.body_chordpro ?? '',
      has_chords: trackLyrics?.has_chords ?? false,
    },
  });

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  function onSave() {
    void metaForm.handleSubmit((metaValues) => {
      startTransition(async () => {
        try {
          setError(null);
          const lyricsValues = lyricsForm.getValues();

          if (track) {
            await updateTrack(track.id, metaValues);
            await updateTrackCategories(track.id, selectedCategories);
            if (lyricsValues.body_plain || lyricsValues.body_chordpro) {
              await upsertLyrics(track.id, lyricsValues);
            }
          } else {
            await createTrack(metaValues, selectedCategories, lyricsValues);
          }

          router.push('/admin/tracks');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Error al guardar');
        }
      });
    })();
  }

  const KIND_LABELS: Record<string, string> = { genre: 'Género', mood: 'Atmósfera', theme: 'Tema', tag: 'Etiqueta' };
  const groupedCategories = categories.reduce<Record<string, Category[]>>((acc, cat) => {
    (acc[cat.kind] ??= []).push(cat);
    return acc;
  }, {});

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
          {/* Tab 0: Metadatos */}
          {activeTab === 0 && (
            <Stack spacing={2.5}>
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
                    <TextField {...field} select label="Idioma" size="small" sx={{ minWidth: 120 }}>
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
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      label="Fecha de publicación"
                      type="datetime-local"
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
              <Controller
                name="duration_seconds"
                control={metaForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    label="Duración (segundos)"
                    type="number"
                    size="small"
                    sx={{ maxWidth: 200 }}
                  />
                )}
              />
            </Stack>
          )}

          {/* Tab 1: Categorías */}
          {activeTab === 1 && (
            <Box>
              {Object.entries(groupedCategories).map(([kind, cats]) => (
                <Box key={kind} sx={{ mb: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: cssVars.textMuted, fontSize: '0.7rem', letterSpacing: '0.08em', mb: 1, display: 'block' }}
                  >
                    {KIND_LABELS[kind] ?? kind}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
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
                  </Stack>
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))}
            </Box>
          )}

          {/* Tab 2: Letra */}
          {activeTab === 2 && (
            <Stack spacing={2.5}>
              <Controller
                name="locale"
                control={lyricsForm.control}
                render={({ field }) => (
                  <TextField {...field} select label="Idioma de la letra" size="small" sx={{ maxWidth: 160 }}>
                    <MenuItem value="es">Español</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="pt">Português</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="body_plain"
                control={lyricsForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Letra (texto plano)"
                    multiline
                    minRows={8}
                    size="small"
                    fullWidth
                    inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
                  />
                )}
              />
              <Controller
                name="body_chordpro"
                control={lyricsForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Letra con acordes (ChordPro)"
                    multiline
                    minRows={8}
                    size="small"
                    fullWidth
                    inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
                    helperText='Formato ChordPro: [Am]Letra [G]más letra'
                  />
                )}
              />
              <Controller
                name="has_chords"
                control={lyricsForm.control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Esta canción tiene acordes"
                  />
                )}
              />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
