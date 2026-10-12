type AudioContextCtor = typeof AudioContext;

const getAudioContextCtor = (): AudioContextCtor | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
};

/**
 * Plays a short, quiet, cheerful arpeggio synthesized at runtime via the Web
 * Audio API — no bundled file, so there's nothing to license and nothing
 * that can 404. Used as the victory-screen sound when no real music asset
 * is present (see public/audio/README in useCelebrationAudio). Returns a
 * stop function that cancels any still-pending notes and releases the
 * audio context; safe to call multiple times.
 */
export const playCelebrationChime = (perfect: boolean): (() => void) => {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return () => {};

  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return () => {};
  }

  const notes = perfect ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
  const timeouts: ReturnType<typeof setTimeout>[] = [];
  let stopped = false;

  const playNote = (freq: number) => {
    if (stopped || ctx.state === 'closed') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.55);
  };

  ctx.resume().catch(() => {
    // Autoplay/gesture restrictions (common in Android WebViews) — fail
    // silently rather than throwing; the celebration still works visually.
  });

  notes.forEach((freq, i) => {
    timeouts.push(setTimeout(() => playNote(freq), i * 180));
  });

  return () => {
    stopped = true;
    timeouts.forEach(clearTimeout);
    ctx.close().catch(() => {});
  };
};
