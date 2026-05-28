import { beforeEach, describe, expect, it } from 'vitest';
import { usePlayerStore } from './playerStore';

beforeEach(() => {
  usePlayerStore.setState({
    volume: 0.85,
    muted: false,
    repeat: 'off',
    shuffle: false,
    status: 'idle',
    position: 0,
    duration: 0,
    error: null,
  });
});

describe('playerStore', () => {
  it('clamps volume into [0, 1]', () => {
    usePlayerStore.getState().setVolume(1.4);
    expect(usePlayerStore.getState().volume).toBe(1);
    usePlayerStore.getState().setVolume(-0.2);
    expect(usePlayerStore.getState().volume).toBe(0);
  });

  it('cycles repeat off → all → one → off', () => {
    expect(usePlayerStore.getState().repeat).toBe('off');
    usePlayerStore.getState().cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe('all');
    usePlayerStore.getState().cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe('one');
    usePlayerStore.getState().cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe('off');
  });

  it('toggles muted', () => {
    usePlayerStore.getState().toggleMuted();
    expect(usePlayerStore.getState().muted).toBe(true);
    usePlayerStore.getState().toggleMuted();
    expect(usePlayerStore.getState().muted).toBe(false);
  });

  it('toggles shuffle', () => {
    usePlayerStore.getState().toggleShuffle();
    expect(usePlayerStore.getState().shuffle).toBe(true);
  });

  it('resets ephemeral state but keeps persisted preferences', () => {
    usePlayerStore.setState({ status: 'playing', position: 42, duration: 60, error: 'x' });
    usePlayerStore.getState().setVolume(0.5);
    usePlayerStore.getState().cycleRepeat(); // → 'all'
    usePlayerStore.getState().reset();
    const s = usePlayerStore.getState();
    expect(s.status).toBe('idle');
    expect(s.position).toBe(0);
    expect(s.duration).toBe(0);
    expect(s.error).toBeNull();
    expect(s.volume).toBe(0.5);
    expect(s.repeat).toBe('all');
  });
});
