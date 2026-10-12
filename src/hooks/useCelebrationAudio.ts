import { useEffect, useRef } from 'react';
import { playCelebrationChime } from '../utils/celebrationChime';

// Preferred real asset path — if you add a licensed instrumental track here,
// it plays instead of the synthesized fallback chime automatically. See
// public/audio/README.md for the exact filename expected.
const MUSIC_SRC = '/audio/victory-music.mp3';
const MUSIC_VOLUME = 0.22;

/**
 * Plays the victory-screen celebration sound exactly once per mount
 * (guarded so a re-render never double-triggers it), respects the saved
 * mute preference, and cleans up fully on unmount so leaving the screen
 * always stops it. Prefers a real bundled music file; falls back to a
 * synthesized chime (see celebrationChime.ts) when no file is present or
 * playback fails for any reason.
 */
export const useCelebrationAudio = (enabled: boolean, perfect: boolean): void => {
  const startedRef = useRef(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const stopChimeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    if (startedRef.current) return undefined;
    startedRef.current = true;

    let fallbackTriggered = false;
    const triggerFallback = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      stopChimeRef.current = playCelebrationChime(perfect);
    };

    const audio = new Audio(MUSIC_SRC);
    audio.volume = MUSIC_VOLUME;
    audio.loop = false;
    audioElRef.current = audio;
    audio.addEventListener('error', triggerFallback);
    audio.play().catch(triggerFallback);

    return () => {
      startedRef.current = false;
      const audioEl = audioElRef.current;
      if (audioEl) {
        audioEl.pause();
        audioEl.removeEventListener('error', triggerFallback);
        audioElRef.current = null;
      }
      stopChimeRef.current?.();
      stopChimeRef.current = null;
    };
  }, [enabled, perfect]);
};
