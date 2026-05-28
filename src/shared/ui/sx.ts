import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Merge a base `sx` with an override from props.
 * Handles `undefined`, single object and array forms uniformly,
 * producing a single SxProps array that MUI consumes natively.
 */
export function mergeSx(base: SxProps<Theme>, override?: SxProps<Theme>): SxProps<Theme> {
  if (!override) return base;
  const overrideArray = (
    Array.isArray(override) ? override : [override]
  ) as readonly SxProps<Theme>[];
  const baseArray = (Array.isArray(base) ? base : [base]) as readonly SxProps<Theme>[];
  return [...baseArray, ...overrideArray] as SxProps<Theme>;
}
