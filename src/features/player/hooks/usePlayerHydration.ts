'use client';

import { useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';

/**
 * Rehydrate the persisted slice of the player store from localStorage.
 *
 * We disabled automatic hydration on the store (`skipHydration: true`) so the
 * server-rendered HTML matches the initial client render; once mounted on the
 * client we fire a one-shot rehydration here.
 */
export function usePlayerHydration(): void {
  useEffect(() => {
    void usePlayerStore.persist.rehydrate();
  }, []);
}
