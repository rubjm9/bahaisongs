import type { ReactNode } from 'react';
import { AppShell } from '@/shared/ui/AppShell';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
