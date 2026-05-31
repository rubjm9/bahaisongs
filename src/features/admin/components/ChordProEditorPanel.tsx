'use client';

/**
 * Split-pane ChordPro editor for admin.
 *
 * Left: chordpro-editor (Monaco + syntax highlighting)
 * Right: chordpro-renderer (live preview with chord diagrams)
 *
 * Both are Lit-based web components loaded client-side only.
 * This file must only be rendered via next/dynamic with { ssr: false }.
 */

import { useEffect, useRef } from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { useTheme } from 'next-themes';
import 'chordpro-editor';
import '@parent-tobias/chordpro-renderer';
import { cssVars, radii, accent } from '@/shared/theme/tokens';

/**
 * Common chords organized by category for the quick-insert toolbar.
 * Names must match ChordPro notation used in the song library.
 */
const QUICK_CHORDS: { label: string; chords: string[] }[] = [
  { label: 'Mayores', chords: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  { label: 'Menores', chords: ['Am', 'Bm', 'Cm', 'Dm', 'Em', 'Fm', 'Gm'] },
  { label: '7ª', chords: ['G7', 'C7', 'D7', 'E7', 'A7', 'Am7', 'Em7', 'Dm7'] },
  { label: 'Solfeo', chords: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Lam', 'Rem', 'Mim', 'Sol7'] },
];

// Types for Lit web components are declared in src/shared/types/custom-elements.d.ts

interface Props {
  value: string;
  onChange: (value: string) => void;
  plainText?: string;
  onPlainTextChange?: (value: string) => void;
}

/**
 * Quick-insert a chord token at the end of the content.
 *
 * Note: inserting at the exact cursor position would require access to the
 * Monaco instance inside the chordpro-editor shadow DOM. As a practical
 * alternative, we append the token after the last non-empty line so the
 * editor picks up the change and the admin can move it as needed.
 */
function appendChordToken(content: string, chord: string): string {
  const token = `[${chord}]`;
  // If there's content, append on the same last line (so it reads naturally)
  if (!content.trim()) return token;
  const lines = content.split('\n');
  let lastNonEmpty = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if ((lines[i] ?? '').trim().length > 0) { lastNonEmpty = i; break; }
  }
  if (lastNonEmpty === -1) return content + token;
  lines[lastNonEmpty] = (lines[lastNonEmpty] ?? '') + token;
  return lines.join('\n');
}

export function ChordProEditorPanel({ value, onChange, plainText, onPlainTextChange }: Props) {
  const editorRef = useRef<HTMLElement>(null);
  const rendererRef = useRef<HTMLElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Sync editor content and listen for changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Set initial content
    if ((editor as unknown as { content: string }).content !== value) {
      (editor as unknown as { content: string }).content = value;
    }

    function handleChange(e: Event) {
      const detail = (e as CustomEvent<{ content: string }>).detail;
      onChange(detail.content);
    }

    editor.addEventListener('content-changed', handleChange);
    return () => editor.removeEventListener('content-changed', handleChange);
    // value omitted: external updates are synced by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount listener once
  }, [onChange]);

  // Keep editor in sync when value changes externally (e.g. form reset)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const current = (editor as unknown as { content: string }).content;
    if (current !== value) {
      (editor as unknown as { content: string }).content = value;
    }
  }, [value]);

  // Sync preview
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    (renderer as unknown as { content: string }).content = value;
  }, [value]);

  // Update editor theme when app theme changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    (editor as unknown as { theme: string }).theme = isDark ? 'chordpro-dark' : 'chordpro-light';
  }, [isDark]);

  const panelBorder = `1px solid ${isDark ? 'rgba(110,168,254,0.12)' : 'rgba(30,144,255,0.14)'}`;
  const labelColor = cssVars.textMuted;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '55% 45%' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        {/* Editor pane */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: labelColor, fontWeight: 600, mb: 1, display: 'block', letterSpacing: '0.04em' }}
          >
            Editor ChordPro
          </Typography>
          <Box
            sx={{
              borderRadius: `${radii.md}px`,
              border: panelBorder,
              overflow: 'hidden',
              height: { xs: '50vh', lg: '70vh' },
              '& chordpro-editor': { width: '100%', height: '100%', display: 'block' },
            }}
          >
            <chordpro-editor
              ref={editorRef}
              content={value}
              theme={isDark ? 'chordpro-dark' : 'chordpro-light'}
              font-size={14}
              line-numbers={true}
              minimap={false}
              word-wrap={true}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{ color: labelColor, mt: 0.75, display: 'block', lineHeight: 1.5 }}
          >
            Formato ChordPro: <code style={{ color: accent.electric }}>[Am]letra [G]más letra</code>
            {' · '}Secciones: <code style={{ color: accent.electric }}>{'{start_of_chorus}'}</code>
          </Typography>
        </Box>

        {/* Preview pane */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: labelColor, fontWeight: 600, mb: 1, display: 'block', letterSpacing: '0.04em' }}
          >
            Vista previa
          </Typography>
          <Box
            sx={{
              borderRadius: `${radii.md}px`,
              border: panelBorder,
              overflow: 'auto',
              height: { xs: '50vh', lg: '70vh' },
              // Override chordpro-renderer CSS variables to match BahaiSongs theme
              '& chordpro-renderer': {
                display: 'block',
                width: '100%',
                height: '100%',
                '--viewer-bg': isDark ? '#0B1A33' : '#FFFFFF',
                '--viewer-text': isDark ? '#E6F0FF' : '#0D1F3C',
                '--chord-color': accent.electric,
                '--chord-weight': '700',
                '--header-color': isDark ? '#E6F0FF' : '#0D1F3C',
                '--component-bg': isDark ? '#050B1A' : '#F0F4FA',
                '--component-text': isDark ? '#E6F0FF' : '#0D1F3C',
                '--chord-charts-bg': isDark ? '#0B1A33' : '#F8FAFF',
                '--chord-charts-border': isDark ? 'rgba(110,168,254,0.12)' : 'rgba(30,144,255,0.14)',
                '--button-bg': accent.electric,
                '--select-bg': isDark ? '#0B1A33' : '#F8FAFF',
                '--select-color': isDark ? '#E6F0FF' : '#0D1F3C',
                '--select-border-color': isDark ? 'rgba(110,168,254,0.24)' : 'rgba(30,144,255,0.26)',
                '--paragraph-spacing': '1.5em',
              },
            }}
          >
            <chordpro-renderer
              ref={rendererRef}
              content={value}
              instrument="guitar"
              show-chords={true}
              chord-position="top"
              format="html"
            />
          </Box>
        </Box>
      </Box>

      {/* Quick-insert chord toolbar */}
      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          borderRadius: `${radii.md}px`,
          border: `1px solid ${isDark ? 'rgba(110,168,254,0.10)' : 'rgba(30,144,255,0.12)'}`,
          background: isDark ? 'rgba(11,26,51,0.5)' : 'rgba(248,250,255,0.8)',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: labelColor, fontWeight: 600, mb: 1, display: 'block', letterSpacing: '0.04em' }}
        >
          Insertar acorde rápido
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {QUICK_CHORDS.map(({ label, chords }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography
                variant="caption"
                sx={{ color: labelColor, minWidth: 52, fontSize: '0.7rem', opacity: 0.7 }}
              >
                {label}
              </Typography>
              {chords.map((chord) => (
                <Tooltip key={chord} title={`Insertar [${chord}]`} placement="top">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onChange(appendChordToken(value, chord))}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      py: 0.25,
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      lineHeight: 1.4,
                      borderColor: isDark ? 'rgba(110,168,254,0.2)' : 'rgba(30,144,255,0.25)',
                      color: accent.electric,
                      '&:hover': {
                        background: `${accent.electric}1a`,
                        borderColor: accent.electric,
                      },
                    }}
                  >
                    {chord}
                  </Button>
                </Tooltip>
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Plain text field */}
      {onPlainTextChange !== undefined && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="caption"
            sx={{ color: labelColor, fontWeight: 600, mb: 1, display: 'block', letterSpacing: '0.04em' }}
          >
            Letra en texto plano
          </Typography>
          <Typography variant="caption" sx={{ color: labelColor, lineHeight: 1.5, display: 'block', mb: 1 }}>
            Usado para búsqueda y extractos. Puedes dejarlo vacío y generarlo automáticamente.
          </Typography>
          <Box
            component="textarea"
            value={plainText ?? ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onPlainTextChange(e.target.value)}
            rows={8}
            spellCheck={false}
            sx={{
              width: '100%',
              boxSizing: 'border-box',
              p: 1.5,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.65,
              border: panelBorder,
              borderRadius: `${radii.md}px`,
              background: 'transparent',
              color: cssVars.textPrimary,
              resize: 'vertical',
              outline: 'none',
              '&:focus': { borderColor: accent.electric },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
