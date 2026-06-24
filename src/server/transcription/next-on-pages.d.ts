declare module '@cloudflare/next-on-pages' {
  import type { CloudflareBindings } from './types';

  export function getRequestContext(): { env: CloudflareBindings };
}
