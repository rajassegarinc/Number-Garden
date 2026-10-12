import { useCallback, useEffect, useRef, useState } from 'react';

const isSpeechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export const useSpeech = (enabled: boolean) => {
  const [supported] = useState(isSpeechSupported);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!supported) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang.startsWith('en') && /child|female/i.test(v.name)) ??
        voices.find((v) => v.lang.startsWith('en')) ??
        voices[0] ??
        null;
    };

    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !enabled) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 1.15;
        if (voiceRef.current) utterance.voice = voiceRef.current;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis can throw in some browsers/contexts; fail silently.
      }
    },
    [supported, enabled],
  );

  return { speak, supported };
};
