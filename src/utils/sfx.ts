import { getAudioContextCtor } from './celebrationChime';

// A single shared AudioContext reused across every short mission sound
// effect (collect/place/sequence-step) — creating a fresh context per tap
// is wasteful and some browsers cap how many can exist at once. Lazily
// created on first use (never at module load, which would run before any
// user gesture and could throw in strict autoplay-policy browsers).
let sharedCtx: AudioContext | null = null;

const getSharedContext = (): AudioContext | null => {
  if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  try {
    sharedCtx = new Ctor();
    return sharedCtx;
  } catch {
    return null;
  }
};

const playNote = (ctx: AudioContext, freq: number, startDelay: number, durationMs: number, volume = 0.09) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime + startDelay;
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
};

const playTones = (freqs: number[], gapMs = 70, durationMs = 160, volume = 0.09): void => {
  const ctx = getSharedContext();
  if (!ctx) return;
  ctx.resume().catch(() => {
    // Autoplay/gesture restrictions — fail silently, gameplay still works visually.
  });
  freqs.forEach((freq, i) => playNote(ctx, freq, (i * gapMs) / 1000, durationMs, volume));
};

/** A quick, friendly blip when a collectible (banana/egg) is picked up. */
export const playCollectBlip = (): void => playTones([880]);

/** A slightly brighter two-note chime when an item lands in its basket/nest. */
export const playPlaceChime = (): void => playTones([659.25, 987.77]);

/** A short rising run for completing a stepping-stone hop / sequence step. */
export const playStepChime = (): void => playTones([523.25, 659.25]);

/** A very quiet pop for any button tap (shared press feedback). */
export const playTapPop = (): void => playTones([740], 0, 70, 0.035);

/** A bright rising three-note chime for a correct answer. */
export const playCorrectChime = (): void => playTones([659.25, 783.99, 1046.5], 80, 200, 0.08);

/** A soft, low two-note "oops" for a wrong answer. Gentle on purpose: no buzzer. */
export const playOopsBoop = (): void => playTones([329.63, 293.66], 110, 200, 0.06);
