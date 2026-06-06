'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Check, X, Eye } from 'lucide-react';
import { DataTable, type Column } from '@/features/admin/components/DataTable';
import { reviewSuggestion } from '@/features/admin/actions/suggestions';
import { cssVars, radii } from '@/shared/theme/tokens';

interface SuggestionRow {
  id: string;
  status: string;
  created_at: string;
  payload: Record<string, unknown>;
  submitter_name: string | null;
  submitter_email: string | null;
  review_notes: string | null;
  upload_path: string | null;
}

function payloadArtist(payload: Record<string, unknown>): string | null {
  if (typeof payload.artistName === 'string' && payload.artistName) return payload.artistName;
  if (typeof payload.artist === 'string' && payload.artist) return payload.artist;
  return null;
}

function payloadSource(payload: Record<string, unknown>): { kind?: string; ref?: string } | null {
  const source = payload.source;
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    const record = source as Record<string, unknown>;
    const parsed: { kind?: string; ref?: string } = {};
    if (typeof record.kind === 'string') parsed.kind = record.kind;
    if (typeof record.ref === 'string') parsed.ref = record.ref;
    return parsed;
  }
  return null;
}

function hasAudioSource(row: SuggestionRow): boolean {
  if (row.upload_path) return true;
  const source = payloadSource(row.payload);
  return !!(source?.ref && (source.kind === 'youtube' || source.kind === 'mp3_r2'));
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <Box>
      <Typography variant="caption" sx={{ color: cssVars.textMuted, fontWeight: 600, display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

function SuggestionDetail({ row }: { row: SuggestionRow }) {
  const [showRaw, setShowRaw] = useState(false);
  const source = payloadSource(row.payload);
  const categories = Array.isArray(row.payload.categorySlugs)
    ? row.payload.categorySlugs.filter((s): s is string => typeof s === 'string').join(', ')
    : null;

  return (
    <Stack spacing={2}>
      <DetailField label="Título" value={typeof row.payload.title === 'string' ? row.payload.title : null} />
      <DetailField label="Artista" value={payloadArtist(row.payload)} />
      <DetailField label="Idioma" value={
        typeof row.payload.language === 'string'
          ? typeof row.payload.languageLabel === 'string' && row.payload.languageLabel
            ? `${row.payload.languageLabel} (${row.payload.language})`
            : row.payload.language
          : null
      } />
      <DetailField label="Categorías" value={categories} />
      <DetailField
        label="Categoría propuesta"
        value={typeof row.payload.suggestedCategory === 'string' ? row.payload.suggestedCategory : null}
      />
      <DetailField
        label="Fuente de audio"
        value={
          source?.kind && source.ref
            ? `${source.kind === 'youtube' ? 'YouTube' : 'MP3'}: ${source.ref}`
            : row.upload_path ?? null
        }
      />
      <DetailField
        label="Letra (texto)"
        value={typeof row.payload.lyricsPlain === 'string' ? row.payload.lyricsPlain : null}
      />
      <DetailField
        label="Letra (ChordPro)"
        value={typeof row.payload.lyricsChordPro === 'string' ? row.payload.lyricsChordPro : null}
      />
      <DetailField label="Notas del submitter" value={typeof row.payload.notes === 'string' ? row.payload.notes : null} />
      <DetailField
        label="Contacto"
        value={[row.submitter_name, row.submitter_email].filter(Boolean).join(' · ') || null}
      />

      <Button size="small" variant="text" onClick={() => setShowRaw((v) => !v)} sx={{ alignSelf: 'flex-start' }}>
        {showRaw ? 'Ocultar JSON' : 'Ver JSON completo'}
      </Button>
      {showRaw && (
        <Box
          component="pre"
          sx={{
            fontSize: '0.75rem',
            background: cssVars.bgPrimary,
            border: `1px solid ${cssVars.borderSubtle}`,
            borderRadius: `${radii.md}px`,
            p: 2,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 240,
            color: cssVars.textPrimary,
          }}
        >
          {JSON.stringify(row.payload, null, 2)}
        </Box>
      )}
    </Stack>
  );
}

const STATUS_LABEL: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', withdrawn: 'Retirada' };
const STATUS_COLOR: Record<string, string> = { pending: '#F59E0B', approved: '#34D399', rejected: '#F87171', withdrawn: '#94A3B8' };

interface Props {
  initialSuggestions: SuggestionRow[];
}

export function SuggestionsClient({ initialSuggestions }: Props) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [statusTab, setStatusTab] = useState(0);
  const [detailSuggestion, setDetailSuggestion] = useState<SuggestionRow | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  const statusFilter = ['pending', 'approved', 'rejected', 'withdrawn'][statusTab]!;
  const filtered = suggestions.filter((s) => s.status === statusFilter);

  const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, withdrawn: 0 };
  for (const s of suggestions) counts[s.status] = (counts[s.status] ?? 0) + 1;

  function onReview() {
    if (!reviewTarget) return;
    startTransition(async () => {
      await reviewSuggestion(reviewTarget.id, reviewTarget.action, reviewNotes || undefined);
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === reviewTarget.id ? { ...s, status: reviewTarget.action, review_notes: reviewNotes || null } : s,
        ),
      );
      setReviewTarget(null);
      setReviewNotes('');
    });
  }

  const columns: Column<SuggestionRow>[] = [
    {
      key: 'title',
      label: 'Sugerencia',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {typeof row.payload.title === 'string' ? row.payload.title : `Sugerencia ${row.id.slice(0, 8)}`}
          </Typography>
          <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
            {row.submitter_name ?? 'Usuario desconocido'} · {new Date(row.created_at).toLocaleDateString('es')}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'artist',
      label: 'Artista',
      width: 140,
      render: (row) => (
        <Typography variant="body2" sx={{ color: cssVars.textMuted }}>
          {payloadArtist(row.payload) ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'audio',
      label: 'Audio',
      width: 70,
      align: 'center',
      render: (row) => (
        <Chip
          label={hasAudioSource(row) ? 'Sí' : 'No'}
          size="small"
          sx={{
            fontSize: '0.65rem',
            height: 20,
            fontWeight: 600,
            background: hasAudioSource(row) ? 'rgba(79,209,255,0.15)' : 'transparent',
            color: hasAudioSource(row) ? '#4FD1FF' : cssVars.textMuted,
          }}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 110,
      align: 'right',
      render: (row) => (
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Ver detalle">
            <IconButton size="small" onClick={() => setDetailSuggestion(row)} aria-label="Ver sugerencia">
              <Eye size={15} />
            </IconButton>
          </Tooltip>
          {row.status === 'pending' && (
            <>
              <Tooltip title="Aprobar">
                <IconButton
                  size="small"
                  onClick={() => { setReviewTarget({ id: row.id, action: 'approved' }); setReviewNotes(''); }}
                  aria-label="Aprobar sugerencia"
                  sx={{ color: 'success.main' }}
                >
                  <Check size={15} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rechazar">
                <IconButton
                  size="small"
                  onClick={() => { setReviewTarget({ id: row.id, action: 'rejected' }); setReviewNotes(''); }}
                  aria-label="Rechazar sugerencia"
                  sx={{ color: 'error.main' }}
                >
                  <X size={15} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Tabs value={statusTab} onChange={(_, v) => setStatusTab(v as number)} sx={{ mb: 3, borderBottom: `1px solid ${cssVars.borderSubtle}` }}>
        {(['pending', 'approved', 'rejected', 'withdrawn'] as const).map((status) => (
          <Tab
            key={status}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>{STATUS_LABEL[status]}</span>
                {(counts[status] ?? 0) > 0 && (
                  <Box sx={{ width: 18, height: 18, borderRadius: '9px', background: STATUS_COLOR[status] ?? '#94A3B8', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {counts[status]}
                  </Box>
                )}
              </Stack>
            }
          />
        ))}
      </Tabs>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        emptyMessage={`No hay sugerencias ${STATUS_LABEL[statusFilter]?.toLowerCase() ?? ''}`}
      />

      {/* Detail dialog */}
      <Dialog open={!!detailSuggestion} onClose={() => setDetailSuggestion(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalle de la sugerencia</DialogTitle>
        <DialogContent>
          {detailSuggestion && (
            <Stack spacing={2}>
              <SuggestionDetail row={detailSuggestion} />
              {detailSuggestion.review_notes && (
                <Box sx={{ p: 1.5, borderRadius: `${radii.md}px`, background: cssVars.bgPrimary, border: `1px solid ${cssVars.borderSubtle}` }}>
                  <Typography variant="caption" sx={{ color: cssVars.textMuted, display: 'block', mb: 0.5, fontWeight: 600 }}>Notas de revisión</Typography>
                  <Typography variant="body2">{detailSuggestion.review_notes}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailSuggestion(null)} variant="outlined">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Review confirmation */}
      <Dialog open={!!reviewTarget} onClose={() => setReviewTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{reviewTarget?.action === 'approved' ? 'Aprobar sugerencia' : 'Rechazar sugerencia'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Notas de revisión (opcional)"
            multiline
            minRows={2}
            fullWidth
            size="small"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setReviewTarget(null)} disabled={isPending}>Cancelar</Button>
          <Button
            variant="contained"
            color={reviewTarget?.action === 'approved' ? 'success' : 'error'}
            onClick={onReview}
            disabled={isPending}
          >
            {reviewTarget?.action === 'approved' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
