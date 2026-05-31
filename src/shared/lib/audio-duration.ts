/** Probe duration in seconds from a direct audio URL (MP3, etc.). */
export function probeAudioDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const cleanup = () => {
      audio.removeAttribute('src');
      audio.load();
    };

    audio.preload = 'metadata';
    audio.addEventListener(
      'loadedmetadata',
      () => {
        const seconds = Number.isFinite(audio.duration) ? Math.round(audio.duration) : null;
        cleanup();
        resolve(seconds && seconds > 0 ? seconds : null);
      },
      { once: true },
    );
    audio.addEventListener(
      'error',
      () => {
        cleanup();
        resolve(null);
      },
      { once: true },
    );
    audio.src = url;
  });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
