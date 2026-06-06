'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { CheckCircle2, Music, Youtube } from 'lucide-react';
import type { Locale } from '@/shared/lib/i18n/config';
import { categoryLabel } from '@/features/catalog/lib/category-labels';
import { TRACK_LANGUAGES, trackLanguageLabels } from '@/features/catalog/lib/track-languages';
import { useUser } from '@/features/auth/hooks/useUser';
import { useLoginPrompt } from '@/features/auth/hooks/useLoginPrompt';
import { submitSuggestion } from '@/features/suggestions/actions/submitSuggestion';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import { GlowButton } from '@/shared/ui/GlowButton';

interface Props {
  locale: Locale;
  categorySlugs: string[];
}

function sectionTitle(text: string) {
  return (
    <Typography
      sx={{
        color: accent.cyan,
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        mb: 1.5,
      }}
    >
      {text}
    </Typography>
  );
}

export function SuggestForm({ locale, categorySlugs }: Props) {
  const t = useTranslations('suggest');
  const { user, profile, loading: authLoading } = useUser();
  const openLogin = useLoginPrompt((s) => s.open);

  const [suggestionId, setSuggestionId] = useState(() => crypto.randomUUID());
  const [sourceKind, setSourceKind] = useState<'mp3_r2' | 'youtube'>('youtube');
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [language, setLanguage] = useState<(typeof TRACK_LANGUAGES)[number]>('es');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lyricsPlain, setLyricsPlain] = useState('');
  const [lyricsChordPro, setLyricsChordPro] = useState('');
  const [hasChords, setHasChords] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const displayName = profile?.displayName ?? user?.email ?? t('submitterName');

  const ERROR_KEYS = [
    'required',
    'invalidEmail',
    'invalidCategory',
    'youtubeRequired',
    'invalidYoutube',
    'uploadRequired',
    'invalidUploadPath',
    'rightsRequired',
    'nameRequired',
    'emailRequired',
    'serviceUnavailable',
    'validationFailed',
    'insertFailed',
    'uploadFailed',
  ] as const;

  type ErrorKey = (typeof ERROR_KEYS)[number];

  function isErrorKey(code: string): code is ErrorKey {
    return (ERROR_KEYS as readonly string[]).includes(code);
  }

  function errorMessage(code: string): string {
    return isErrorKey(code) ? t(`errors.${code}`) : code;
  }

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  async function uploadMp3(file: File): Promise<string> {
    const res = await fetch('/api/suggestion-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suggestionId,
        filename: file.name,
        contentType: file.type || 'audio/mpeg',
      }),
    });

    if (!res.ok) throw new Error('uploadFailed');
    const { uploadUrl, uploadPath: path } = (await res.json()) as {
      uploadUrl: string;
      uploadPath: string;
    };

    setUploadProgress(10);
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'audio/mpeg' },
      body: file,
    });
    setUploadProgress(100);

    if (!putRes.ok) throw new Error('uploadFailed');
    return path;
  }

  function resetForm() {
    setTitle('');
    setArtistName('');
    setLanguage('es');
    setSelectedCategories([]);
    setYoutubeUrl('');
    setMp3File(null);
    setUploadPath(null);
    setUploadProgress(null);
    setLyricsPlain('');
    setLyricsChordPro('');
    setHasChords(false);
    setNotes('');
    setSubmitterName('');
    setSubmitterEmail('');
    setRightsConfirmed(false);
    setFieldErrors({});
    setFormError(null);
    setSuccess(false);
    setSuggestionId(crypto.randomUUID());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(() => {
      void (async () => {
      try {
        let resolvedUploadPath = uploadPath;

        if (sourceKind === 'mp3_r2') {
          if (!mp3File && !resolvedUploadPath) {
            setFieldErrors({ uploadPath: 'uploadRequired' });
            return;
          }
          if (mp3File && !resolvedUploadPath) {
            setUploadProgress(0);
            resolvedUploadPath = await uploadMp3(mp3File);
            setUploadPath(resolvedUploadPath);
          }
        }

        const result = await submitSuggestion({
          suggestionId,
          title,
          artistName: artistName || undefined,
          language,
          categorySlugs: selectedCategories,
          sourceKind,
          youtubeUrl: sourceKind === 'youtube' ? youtubeUrl : undefined,
          lyricsPlain: lyricsPlain || undefined,
          lyricsChordPro: lyricsChordPro || undefined,
          hasChords,
          notes: notes || undefined,
          submitterName: submitterName || undefined,
          submitterEmail: submitterEmail || undefined,
          rightsConfirmed: rightsConfirmed as true,
          uploadPath: resolvedUploadPath ?? undefined,
        });

        if (!result.ok) {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          setFormError(errorMessage(result.error));
          return;
        }

        setSuccess(true);
      } catch {
        setFormError(errorMessage('uploadFailed'));
        setUploadProgress(null);
      }
      })();
    });
  }

  if (success) {
    return (
      <Stack spacing={3} alignItems="center" sx={{ py: 6, textAlign: 'center', maxWidth: 520, mx: 'auto' }}>
        <CheckCircle2 size={48} color={accent.cyan} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('successTitle')}
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, lineHeight: 1.6 }}>{t('successBody')}</Typography>
        <GlowButton tone="glass" onClick={resetForm}>
          {t('successAnother')}
        </GlowButton>
      </Stack>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 720,
        mx: 'auto',
        p: { xs: 2.5, md: 4 },
        borderRadius: `${radii.lg}px`,
        border: `1px solid ${cssVars.borderSubtle}`,
        background: cssVars.bgGlass,
      }}
    >
      <Stack spacing={4}>
        {formError && <Alert severity="error">{formError}</Alert>}

        <Box>
          {sectionTitle(t('sectionSong'))}
          <Stack spacing={2}>
            <TextField
              label={t('title')}
              placeholder={t('titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              size="small"
              error={!!fieldErrors.title}
              helperText={fieldErrors.title ? errorMessage(fieldErrors.title) : undefined}
            />
            <TextField
              label={t('artistName')}
              placeholder={t('artistPlaceholder')}
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              fullWidth
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t('language')}</InputLabel>
              <Select
                value={language}
                label={t('language')}
                onChange={(e) => setLanguage(e.target.value as (typeof TRACK_LANGUAGES)[number])}
              >
                {TRACK_LANGUAGES.map((code) => (
                  <MenuItem key={code} value={code}>
                    {trackLanguageLabels[code]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {categorySlugs.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: cssVars.textMuted }}>
                  {t('categories')}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: cssVars.textMuted }}>
                  {t('categoriesHint')}
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {categorySlugs.map((slug) => {
                    const selected = selectedCategories.includes(slug);
                    return (
                      <Chip
                        key={slug}
                        label={categoryLabel(slug, locale)}
                        onClick={() => toggleCategory(slug)}
                        variant={selected ? 'filled' : 'outlined'}
                        sx={{
                          borderColor: selected ? accent.cyan : cssVars.borderSubtle,
                          background: selected ? `${accent.cyan}22` : 'transparent',
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        <Box>
          {sectionTitle(t('sectionAudio'))}
          <Stack spacing={2}>
            <ToggleButtonGroup
              exclusive
              value={sourceKind}
              onChange={(_, v: 'mp3_r2' | 'youtube' | null) => v && setSourceKind(v)}
              size="small"
              sx={{ mb: 1 }}
            >
              <ToggleButton value="youtube">
                <Youtube size={16} style={{ marginRight: 6 }} />
                {t('sourceYoutube')}
              </ToggleButton>
              <ToggleButton value="mp3_r2">
                <Music size={16} style={{ marginRight: 6 }} />
                {t('sourceMp3')}
              </ToggleButton>
            </ToggleButtonGroup>

            {sourceKind === 'youtube' ? (
              <TextField
                label={t('youtubeUrl')}
                placeholder={t('youtubePlaceholder')}
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                fullWidth
                size="small"
                error={!!fieldErrors.youtubeUrl}
                helperText={fieldErrors.youtubeUrl ? errorMessage(fieldErrors.youtubeUrl) : undefined}
              />
            ) : (
              <Box>
                <Button variant="outlined" component="label" size="small" sx={{ mb: 1 }}>
                  {t('mp3Label')}
                  <input
                    type="file"
                    hidden
                    accept="audio/mpeg,.mp3"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setMp3File(file);
                      setUploadPath(null);
                      setUploadProgress(null);
                    }}
                  />
                </Button>
                <FormHelperText sx={{ ml: 0 }}>{t('mp3Hint')}</FormHelperText>
                {mp3File && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: cssVars.textMuted }}>
                    {mp3File.name}
                    {uploadPath ? ` — ${t('mp3Ready')}` : ''}
                  </Typography>
                )}
                {uploadProgress !== null && (
                  <LinearProgress
                    variant={uploadProgress >= 100 ? 'determinate' : 'indeterminate'}
                    value={uploadProgress}
                    sx={{ mt: 1, borderRadius: 1 }}
                  />
                )}
                {fieldErrors.uploadPath && (
                  <FormHelperText error>{errorMessage(fieldErrors.uploadPath)}</FormHelperText>
                )}
              </Box>
            )}
          </Stack>
        </Box>

        <Box>
          {sectionTitle(t('sectionLyrics'))}
          <Stack spacing={2}>
            <TextField
              label={t('lyricsPlain')}
              placeholder={t('lyricsPlainPlaceholder')}
              value={lyricsPlain}
              onChange={(e) => setLyricsPlain(e.target.value)}
              fullWidth
              multiline
              minRows={4}
              size="small"
            />
            <TextField
              label={t('lyricsChordPro')}
              placeholder={t('lyricsChordProPlaceholder')}
              value={lyricsChordPro}
              onChange={(e) => setLyricsChordPro(e.target.value)}
              fullWidth
              multiline
              minRows={4}
              size="small"
            />
            <FormControlLabel
              control={
                <Checkbox checked={hasChords} onChange={(e) => setHasChords(e.target.checked)} size="small" />
              }
              label={t('hasChords')}
            />
            <TextField
              label={t('notes')}
              placeholder={t('notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              size="small"
            />
          </Stack>
        </Box>

        <Box>
          {sectionTitle(t('sectionContact'))}
          {user && !authLoading ? (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" sx={{ color: cssVars.textMuted }}>
                {t('loggedInAs', { name: displayName })}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                label={t('submitterName')}
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                required
                fullWidth
                size="small"
                error={!!fieldErrors.submitterName}
                helperText={fieldErrors.submitterName ? errorMessage(fieldErrors.submitterName) : undefined}
              />
              <TextField
                label={t('submitterEmail')}
                type="email"
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                required
                fullWidth
                size="small"
                error={!!fieldErrors.submitterEmail}
                helperText={fieldErrors.submitterEmail ? errorMessage(fieldErrors.submitterEmail) : undefined}
              />
              <Button size="small" onClick={openLogin} sx={{ alignSelf: 'flex-start' }}>
                {t('signInOptional')}
              </Button>
            </Stack>
          )}
        </Box>

        <Box>
          {sectionTitle(t('sectionLegal'))}
          <FormControlLabel
            control={
              <Checkbox
                checked={rightsConfirmed}
                onChange={(e) => setRightsConfirmed(e.target.checked)}
                required
              />
            }
            label={t('rightsLabel')}
            sx={{ alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.25 } }}
          />
          {fieldErrors.rightsConfirmed && (
            <FormHelperText error sx={{ ml: 4 }}>
              {errorMessage(fieldErrors.rightsConfirmed)}
            </FormHelperText>
          )}
        </Box>

        <GlowButton type="submit" tone="solid" disabled={isPending} sx={{ alignSelf: 'flex-start' }}>
          {isPending ? t('submitting') : t('submit')}
        </GlowButton>
      </Stack>
    </Box>
  );
}
