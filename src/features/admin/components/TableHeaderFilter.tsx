'use client';

import { useState, type ReactNode } from 'react';
import {
  Box,
  Checkbox,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import { accent, cssVars } from '@/shared/theme/tokens';

export interface FilterOption {
  value: string;
  label: string;
}

interface SingleProps {
  mode?: 'single';
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface MultiProps {
  mode: 'multi';
  label: string;
  values: string[];
  options: FilterOption[];
  onChange: (values: string[]) => void;
}

type Props = (SingleProps | MultiProps) & {
  icon?: ReactNode;
};

export function TableHeaderFilter(props: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const isMulti = props.mode === 'multi';
  const active = isMulti
    ? props.values.length > 0
    : props.value !== (props.options[0]?.value ?? '');

  function handleClose() {
    setAnchorEl(null);
  }

  function toggleMulti(value: string) {
    if (!isMulti) return;
    const next = props.values.includes(value)
      ? props.values.filter((v) => v !== value)
      : [...props.values, value];
    props.onChange(next);
  }

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.25,
          border: 'none',
          background: 'transparent',
          color: active ? cssVars.textPrimary : cssVars.textMuted,
          font: 'inherit',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          p: 0,
          '&:hover': { color: cssVars.textPrimary },
        }}
      >
        {props.icon}
        <span>{props.label}</span>
        <ChevronDown size={12} aria-hidden style={{ opacity: active ? 1 : 0.6 }} />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 168,
              background: cssVars.bgElevated,
              border: `1px solid ${cssVars.borderSubtle}`,
            },
          },
        }}
      >
        {props.options.map((opt) => {
          if (isMulti) {
            const checked = props.values.includes(opt.value);
            return (
              <MenuItem
                key={opt.value}
                dense
                onClick={() => toggleMulti(opt.value)}
                sx={{ py: 0.5 }}
              >
                <Checkbox
                  size="small"
                  checked={checked}
                  tabIndex={-1}
                  disableRipple
                  sx={{
                    p: 0.5,
                    mr: 0.5,
                    color: cssVars.textMuted,
                    '&.Mui-checked': { color: accent.cyan },
                  }}
                />
                <ListItemText
                  primary={opt.label}
                  primaryTypographyProps={{ fontSize: '0.82rem' }}
                />
              </MenuItem>
            );
          }

          const selected = props.value === opt.value;
          return (
            <MenuItem
              key={opt.value}
              selected={selected}
              dense
              onClick={() => {
                props.onChange(opt.value);
                handleClose();
              }}
              sx={{
                fontSize: '0.82rem',
                '&.Mui-selected': {
                  background: `${accent.cyan}14`,
                  '&:hover': { background: `${accent.cyan}22` },
                },
              }}
            >
              {opt.label}
            </MenuItem>
          );
        })}
        {isMulti && props.values.length > 0 ? (
          <Box sx={{ px: 1.5, py: 0.75, borderTop: `1px solid ${cssVars.borderSubtle}` }}>
            <Typography
              component="button"
              type="button"
              onClick={() => props.onChange([])}
              sx={{
                border: 'none',
                background: 'transparent',
                color: accent.cyan,
                fontSize: '0.75rem',
                cursor: 'pointer',
                p: 0,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Limpiar filtros
            </Typography>
          </Box>
        ) : null}
      </Menu>
    </>
  );
}
