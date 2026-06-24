'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface AdminTopBarConfig {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

interface AdminTopBarContextValue {
  config: AdminTopBarConfig;
  setConfig: (config: AdminTopBarConfig) => void;
}

const AdminTopBarContext = createContext<AdminTopBarContextValue | null>(null);

export function AdminTopBarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AdminTopBarConfig>({});

  const value = useMemo(() => ({ config, setConfig }), [config]);

  return <AdminTopBarContext.Provider value={value}>{children}</AdminTopBarContext.Provider>;
}

export function useAdminTopBarContext() {
  const ctx = useContext(AdminTopBarContext);
  if (!ctx) {
    throw new Error('useAdminTopBarContext must be used within AdminTopBarProvider');
  }
  return ctx;
}
