'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, IconButton, Skeleton, Stack, Typography } from '@mui/material';
import { Clock, X as XIcon } from 'lucide-react';
import { SearchBox, type SearchBoxHandle } from './SearchBox';
import { SearchResultItem } from './SearchResultItem';
import { useSearch } from '@/features/catalog/hooks/useSearch';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath, trackPath } from '@/shared/lib/seo/paths';

const MAX_INLINE_RESULTS = 6;

/**
 * The topbar's instant-search affordance. Renders a `SearchBox` and a floating
 * results palette that filters as you type. Full results live at `/discover`.
 *
 * Keyboard:
 *   `/`        focus the box (when nothing else has focus)
 *   `↑` / `↓`  move active result
 *   `Enter`    navigate to active result, or to /discover if none focused
 *   `Esc`      close palette / clear query
 */
export function SearchPalette() {
  const t = useTranslations('search');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const boxRef = useRef<SearchBoxHandle | null>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const listId = useId();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const { results, loading } = useSearch(query, { limit: MAX_INLINE_RESULTS });
  const visibleResults = useMemo(() => results.slice(0, MAX_INLINE_RESULTS), [results]);

  const { history, addEntry, clearHistory } = useSearchHistory();

  // Reset active selection whenever the result set changes
  useEffect(() => {
    setActiveIdx(query.trim().length > 0 && visibleResults.length > 0 ? 0 : -1);
  }, [query, visibleResults]);

  // Global "/" and ⌘K / Ctrl+K hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isSlash = e.key === '/' && !isTypingInForm(e.target);
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key === 'k';
      if (isSlash || isCmdK) {
        e.preventDefault();
        boxRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleKey = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, visibleResults.length - 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const trimmed = query.trim();
        const target = visibleResults[activeIdx];
        if (target) {
          addEntry(query);
          router.push(trackPath(target.entry.slug));
          setOpen(false);
        } else if (trimmed.length > 0) {
          addEntry(query);
          router.push(`${appPath(locale, 'discover')}?q=${encodeURIComponent(trimmed)}`);
          setOpen(false);
        }
      }
    },
    [open, visibleResults, activeIdx, query, locale, router, addEntry],
  );

  // Scroll active item into view
  useEffect(() => {
    const node = itemsRef.current[activeIdx];
    node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIdx]);

  const showPalette =
    open &&
    (query.trim().length > 0 || history.length > 0 || (!loading && visibleResults.length > 0));

  return (
    <Box sx={{ position: 'relative' }}>
      <SearchBox
        ref={boxRef}
        value={query}
        onChange={setQuery}
        placeholder={t('placeholder')}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Defer so click on a result registers before close
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKey}
        ariaControls={listId}
        {...(activeIdx >= 0 ? { ariaActiveDescendant: `${listId}-opt-${activeIdx}` } : {})}
      />

      <AnimatePresence>
        {showPalette ? (
          <Box
            component={motion.div}
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.19, 1, 0.22, 1] }}
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              minWidth: { md: 420 },
              maxHeight: 460,
              overflowY: 'auto',
              zIndex: 30,
              background: cssVars.popoverBg,
              backdropFilter: 'blur(24px) saturate(140%)',
              WebkitBackdropFilter: 'blur(24px) saturate(140%)',
              border: `1px solid ${cssVars.borderSubtle}`,
              borderRadius: `${radii.lg}px`,
              boxShadow: cssVars.popoverShadow,
              p: 1,
            }}
          >
            {query.trim().length === 0 ? (
              history.length > 0 ? (
                <SearchHistory
                  history={history}
                  locale={locale}
                  onSelect={(q) => {
                    setQuery(q);
                  }}
                  onClear={clearHistory}
                />
              ) : (
                <Hint eyebrow={t('hintEyebrow')} title={t('hintTitle')} body={t('hintBody')} />
              )
            ) : loading ? (
              <SearchSkeleton />
            ) : visibleResults.length === 0 ? (
              <Hint
                eyebrow={t('emptyEyebrow')}
                title={t('emptyTitle', { query })}
                body={t('emptyBody')}
              />
            ) : (
              <Stack spacing={0.25}>
                {visibleResults.map((r, i) => (
                  <Box
                    key={r.entry.slug}
                    id={`${listId}-opt-${i}`}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <SearchResultItem
                      result={r}
                      locale={locale}
                      active={i === activeIdx}
                      itemRef={(node) => {
                        itemsRef.current[i] = node;
                      }}
                      onSelect={() => {
                        addEntry(query);
                        setOpen(false);
                      }}
                    />
                  </Box>
                ))}
                <Box
                  component="button"
                  onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                  onClick={() => {
                    addEntry(query);
                    router.push(`${appPath(locale, 'discover')}?q=${encodeURIComponent(query.trim())}`);
                    setOpen(false);
                  }}
                  sx={{
                    mt: 0.5,
                    width: '100%',
                    background: 'transparent',
                    border: `1px solid ${cssVars.borderSubtle}`,
                    borderRadius: `${radii.md}px`,
                    color: cssVars.textMuted,
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    '&:hover': {
                      color: cssVars.textPrimary,
                      borderColor: cssVars.borderStrong,
                    },
                  }}
                >
                  {t('seeAll', { query })}
                </Box>
              </Stack>
            )}
          </Box>
        ) : null}
      </AnimatePresence>
    </Box>
  );
}

function Hint({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography
        sx={{
          color: accent.cyan,
          textTransform: 'uppercase',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.18em',
          mb: 0.5,
        }}
      >
        {eyebrow}
      </Typography>
      <Typography sx={{ color: cssVars.textPrimary, fontWeight: 600, fontSize: '0.95rem' }}>
        {title}
      </Typography>
      <Typography sx={{ color: cssVars.textMuted, fontSize: '0.82rem', mt: 0.5 }}>
        {body}
      </Typography>
    </Box>
  );
}

function SearchSkeleton() {
  return (
    <Stack spacing={0.25} sx={{ p: 0.5 }}>
      {[0, 1, 2].map((i) => (
        <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 1.5, py: 1 }}>
          <Skeleton
            variant="rounded"
            width={40}
            height={40}
            sx={{ flexShrink: 0, borderRadius: '8px' }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="65%" height={18} />
            <Skeleton variant="text" width="40%" height={14} sx={{ mt: 0.25 }} />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

function SearchHistory({
  history,
  locale: _locale,
  onSelect,
  onClear,
}: {
  history: string[];
  locale: string;
  onSelect: (query: string) => void;
  onClear: () => void;
}) {
  return (
    <Box sx={{ p: 1 }}>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', px: 0.5, mb: 0.5 }}
      >
        <Box
          sx={{
            fontSize: '0.65rem',
            fontWeight: 700,
            color: cssVars.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Búsquedas recientes
        </Box>
        <IconButton
          size="small"
          onClick={onClear}
          sx={{ color: cssVars.textMuted, '&:hover': { color: cssVars.textPrimary } }}
        >
          <XIcon size={12} />
        </IconButton>
      </Stack>
      <Stack spacing={0.25}>
        {history.map((entry) => (
          <Box
            key={entry}
            component="button"
            onClick={() => onSelect(entry)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: `${radii.md}px`,
              px: 1.5,
              py: 1,
              cursor: 'pointer',
              textAlign: 'left',
              color: cssVars.textPrimary,
              '&:hover': { background: cssVars.hoverSubtle },
            }}
          >
            <Clock size={14} style={{ color: cssVars.textMuted, flexShrink: 0 }} />
            <Box
              sx={{
                fontSize: '0.9rem',
                fontWeight: 500,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {entry}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function isTypingInForm(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if (target.isContentEditable) return true;
  return false;
}
