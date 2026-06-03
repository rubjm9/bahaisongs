import { describe, expect, it } from 'vitest';
import { resolveTrackUuid } from './playlist-tracks';

describe('resolveTrackUuid', () => {
  it('returns the same value when already a UUID', async () => {
    const id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
    const supabase = {
      from: () => {
        throw new Error('should not query');
      },
    } as never;
    await expect(resolveTrackUuid(supabase, id)).resolves.toBe(id);
  });
});
