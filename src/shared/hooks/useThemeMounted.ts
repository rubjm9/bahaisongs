'use client';

import { useEffect, useState } from 'react';

/** True after the client has mounted — safe to read resolved theme from next-themes. */
export function useThemeMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
