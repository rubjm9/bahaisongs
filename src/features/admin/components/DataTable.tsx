'use client';

import { useMemo, useState } from 'react';
import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { cssVars, radii } from '@/shared/theme/tokens';

export type SortDirection = 'asc' | 'desc';

export interface Column<T> {
  key: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  header?: React.ReactNode;
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
}

function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  direction: SortDirection,
): number {
  const factor = direction === 'asc' ? 1 : -1;
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor;
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base' }) * factor;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptyMessage = 'Sin resultados',
  defaultSortKey,
  defaultSortDirection = 'asc',
}: Props<T>) {
  const firstSortableKey = columns.find((col) => col.sortable)?.key;
  const [sortKey, setSortKey] = useState(defaultSortKey ?? firstSortableKey ?? '');
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  const sortedRows = useMemo(() => {
    const column = columns.find((col) => col.key === sortKey && col.sortable);
    if (!column?.sortValue) return rows;
    return [...rows].sort((a, b) =>
      compareSortValues(column.sortValue!(a), column.sortValue!(b), sortDirection),
    );
  }, [columns, rows, sortDirection, sortKey]);

  function handleSort(columnKey: string) {
    if (sortKey === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(columnKey);
    setSortDirection('asc');
  }

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
                sortDirection={col.sortable && sortKey === col.key ? sortDirection : false}
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
                {col.header ?? (col.sortable ? (
                  <TableSortLabel
                    active={sortKey === col.key}
                    direction={sortKey === col.key ? sortDirection : 'asc'}
                    onClick={() => handleSort(col.key)}
                    sx={{
                      color: `${cssVars.textMuted} !important`,
                      '&.Mui-active': { color: `${cssVars.textPrimary} !important` },
                      ...(col.align === 'right'
                        ? {
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            width: '100%',
                          }
                        : {}),
                      '& .MuiTableSortLabel-icon': {
                        color: `${cssVars.textMuted} !important`,
                        opacity: sortKey === col.key ? 1 : 0.4,
                        ...(col.align === 'right' ? { marginLeft: '4px', marginRight: 0 } : {}),
                      },
                      '&.Mui-active .MuiTableSortLabel-icon': {
                        color: `${cssVars.textPrimary} !important`,
                      },
                    }}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                ))}
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
          ) : sortedRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography variant="body2" sx={{ color: cssVars.textMuted }}>
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            sortedRows.map((row) => (
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
