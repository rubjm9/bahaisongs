'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Box, InputBase, IconButton } from '@mui/material';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cssVars, radii } from '@/shared/theme/tokens';

interface Props {
  value: string;
  onChange: (next: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Optional aria-controls for the listbox the box drives. */
  ariaControls?: string;
  /** Currently active option id, for screen reader announcements. */
  ariaActiveDescendant?: string;
}

export interface SearchBoxHandle {
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

/**
 * Topbar search input. Keyboard:
 *   `/` (global) focuses it          — wired by `useSearchHotkey`
 *   `Esc` clears + blurs
 *   Arrow keys / Enter forwarded to `onKeyDown` for list navigation
 */
export const SearchBox = forwardRef<SearchBoxHandle, Props>(function SearchBox(
  {
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    placeholder,
    autoFocus = false,
    ariaControls,
    ariaActiveDescendant,
  },
  ref,
) {
  const t = useTranslations('nav');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [kbdHint, setKbdHint] = useState('/');

  useEffect(() => {
    const mac = /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? navigator.userAgent);
    setKbdHint(mac ? '⌘ K' : 'Ctrl K');
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => onChange(''),
    }),
    [onChange],
  );

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleKey = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (value) {
          onChange('');
        } else {
          inputRef.current?.blur();
        }
        return;
      }
      onKeyDown?.(event);
    },
    [value, onChange, onKeyDown],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        height: 40,
        paddingX: 2,
        background: cssVars.bgGlass,
        border: `1px solid ${cssVars.borderSubtle}`,
        borderRadius: `${radii.pill}px`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: cssVars.textMuted,
        minWidth: { xs: 160, sm: 240, md: 360 },
        transition: 'border-color 160ms, box-shadow 160ms',
        '&:focus-within': {
          borderColor: cssVars.borderStrong,
          boxShadow: cssVars.focusRing,
        },
      }}
    >
      <Search size={16} aria-hidden />
      <InputBase
        inputRef={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...(onFocus ? { onFocus } : {})}
        {...(onBlur ? { onBlur } : {})}
        onKeyDown={handleKey}
        placeholder={placeholder ?? t('search')}
        type="search"
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={Boolean(ariaControls && value.length > 0)}
        {...(ariaControls ? { 'aria-controls': ariaControls } : {})}
        {...(ariaActiveDescendant ? { 'aria-activedescendant': ariaActiveDescendant } : {})}
        sx={{
          flex: 1,
          color: cssVars.textPrimary,
          fontSize: '0.9rem',
          '& ::placeholder': { color: cssVars.textMuted, opacity: 1 },
          // Hide the browser's native "x" on search inputs — we render our own.
          '& input[type=search]::-webkit-search-cancel-button': { display: 'none' },
          '& input[type=search]::-webkit-search-decoration': { display: 'none' },
        }}
      />
      {value ? (
        <IconButton
          aria-label="Clear search"
          size="small"
          onClick={() => onChange('')}
          sx={{ color: cssVars.textMuted, '&:hover': { color: cssVars.textPrimary } }}
        >
          <X size={14} />
        </IconButton>
      ) : (
        <Box
          aria-hidden
          sx={{
            display: { xs: 'none', md: 'inline-flex' },
            alignItems: 'center',
            justifyContent: 'center',
            paddingX: 0.75,
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            color: cssVars.textMuted,
            background: cssVars.hoverSubtle,
            border: `1px solid ${cssVars.borderSubtle}`,
            borderRadius: `${radii.sm}px`,
          }}
        >
          {kbdHint}
        </Box>
      )}
    </Box>
  );
});
