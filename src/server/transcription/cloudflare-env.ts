import type { CloudflareBindings } from './types';

export async function getCloudflareBindings(): Promise<CloudflareBindings | null> {
  try {
    const mod = await import('@cloudflare/next-on-pages');
    const ctx = mod.getRequestContext() as { env?: CloudflareBindings };
    return ctx.env ?? null;
  } catch {
    return null;
  }
}
