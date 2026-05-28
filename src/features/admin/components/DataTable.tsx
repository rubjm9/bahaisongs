'use client';

import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { cssVars, radii } from '@/shared/theme/tokens';

export interface Column<T> {
  key: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, rowKey, loading = false, emptyMessage = 'Sin resultados' }: Props<T>) {
  return (
    <TableContainer
      sx={{
        border: `1px solid ${cssVars.borderSubtle}`,
        borderRadius: `${radii.lg}px`,
        background: cssVars.bgElevated,
        overflow: 'hidden',
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { borderBottom: `1px solid ${cssVars.borderStrong}` } }}>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={col.align ?? 'left'}
                width={col.width}
                sx={{
                  color: cssVars.textMuted,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  py: 1.5,
                  px: 2,
                  background: cssVars.bgElevated,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <CircularProgress size={28} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography variant="body2" sx={{ color: cssVars.textMuted }}>
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                sx={{
                  '& td': { borderBottom: `1px solid ${cssVars.borderSubtle}` },
                  '&:last-child td': { borderBottom: 'none' },
                  '&:hover': { background: cssVars.hoverSubtle },
                  transition: 'background 160ms',
                }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.align ?? 'left'}
                    sx={{ py: 1.25, px: 2, color: cssVars.textPrimary, fontSize: '0.875rem' }}
                  >
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
