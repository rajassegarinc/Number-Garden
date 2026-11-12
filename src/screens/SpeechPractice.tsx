import { useEffect, useMemo, useRef, useState } from 'react';
import { getActivity } from '../data/activities';
import { SOUND_ALIKES, SPEECH_LINES } from '../data/speechLines';
import { GameHeader } from '../components/GameHeader';
import { Mascot } from '../components/Mascot';
import { burstFrom, celebrate, cheerAt } from '../motion/fx';
import type { ActivityId, LevelResult } from '../types';
import './SpeechPractice.css';

interface SpeechPracticeProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
}

/**
 * A step is either "listen" (Ellie says the line while each word lights
 * up, karaoke style) or "say" (the child's turn).
 */
type Step =
  | { kind: 'listen'; lines: number[] }
  | { kind: 'say'; line: number; visible: number[]; showText: boolean };

const ALL = SPEECH_LINES.map((_, i) => i);

/**
 * Level 1: hear each line, then say it with the words on screen.
 * Level 2: say each line from its picture, words hidden until spoken.
 * Level 3: on stage, the whole speech from the pictures alone.
 */
const buildSteps = (level: number): Step[] => {
  if (level <= 1) {
    return [
      ...ALL.flatMap((i): Step[] => [
        { kind: 'listen', lines: [i] },
        { kind: 'say', line: i, visible: [i], showText: true },
      ]),
      { kind: 'listen', lines: ALL },
    ];
  }
  if (level === 2) return ALL.map((i): Step => ({ kind: 'say', line: i, visible: [i], showText: false }));
  return ALL.map((i): Step => ({ kind: 'say', line: i, visible: ALL, showText: false }));
};

const clean = (word: string) => word.toLowerCase().replace(/[^a-z]/g, '');
const LINE_WORDS = SPEECH_LINES.map((line) => line.text.split(/\s+/));

/** Lenient on purpose: a small child's "Karnatak" should count as Karnataka. */
const heardWord = (target: string, heard: string[]): boolean => {
  const t = clean(target);
  const options = [t, ...(SOUND_ALIKES[t] ?? [])];
  return heard.some((h) => options.some((o) => h === o || (o.length >= 5 && h.length >= 4 && o.startsWith(h.slice(0, 4)))));
};

const matchWords = (line: number, transcript: string): boolean[] => {
  const heard = transcript.split(/\s+/).map(clean).filter(Boolean);
  return LINE_WORDS[line].map((w) => heardWord(w, heard));
};

/** Rough length of a spoken word, so the highlight keeps pace with the voice. */
const wordMs = (word: string, rate: number) => (230 + 70 * clean(word).length) / rate;

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  abort(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

const getRecognition = (): (new () => RecognitionLike) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const PRAISE = ['Beautiful speaking!', 'Loud and clear!', 'Wonderful!', 'What a star!'];

type Phase = 'playing' | 'ready' | 'listening' | 'success';

export const SpeechPractice = ({
  activityId,
  level,
  soundOn,
  childName,
  onExit,
  onLevelComplete,
}: SpeechPracticeProps) => {
  const activity = getActivity(activityId);
  const steps = useMemo(() => buildSteps(level), [level]);
  const onStage = level >= 3;

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhaseState] = useState<Phase>('playing');
  // Mirrored in a ref so microphone callbacks always see the current phase.
  const phaseRef = useRef<Phase>('playing');
  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };
  /** Which word Ellie is saying right now. */
  const [karaoke, setKaraoke] = useState<{ line: number; word: number } | null>(null);
  /** Words of the current line the microphone has heard so far. */
  const [heard, setHeard] = useState<boolean[]>([]);
  /** Lines already said, so their words stay revealed on stage. */
  const [doneLines, setDoneLines] = useState<number[]>([]);
  const [micWorks, setMicWorks] = useState(() => getRecognition() !== null);
  const [note, setNote] = useState('');

  const step = steps[stepIndex];
  const runRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const missesRef = useRef(0);
  const helpedRef = useRef(false);
  const firstTryRef = useRef(0);
  const micRef = useRef<HTMLButtonElement>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const canSpeak = soundOn && typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang === 'en-IN') ?? voices.find((v) => v.lang.startsWith('en')) ?? voices[0] ?? null;
    };
    pick();
    window.speechSynthesis.addEventListener('voiceschanged', pick);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pick);
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const stopEverything = () => {
    runRef.current += 1;
    clearTimers();
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Speech synthesis unavailable: nothing to stop.
    }
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  };

  useEffect(() => stopEverything, []);

  const say = (text: string, rate = 0.9, onEnd?: () => void) => {
    if (!canSpeak) {
      onEnd?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN';
      u.rate = rate;
      u.pitch = 1.1;
      if (voiceRef.current) u.voice = voiceRef.current;
      if (onEnd) {
        u.onend = onEnd;
        u.onerror = onEnd;
      }
      window.speechSynthesis.speak(u);
    } catch {
      onEnd?.();
    }
  };

  /** Ellie says the lines one after another while the words light up in time. */
  const playLines = (lines: number[], onDone: () => void) => {
    stopEverything();
    const run = runRef.current;
    const rate = 0.75;
    const playOne = (at: number) => {
      if (run !== runRef.current) return;
      if (at >= lines.length) {
        setKaraoke(null);
        onDone();
        return;
      }
      const line = lines[at];
      const words = LINE_WORDS[line];
      let elapsed = 250;
      words.forEach((w, i) => {
        later(() => run === runRef.current && setKaraoke({ line, word: i }), elapsed);
        elapsed += wordMs(w, rate);
      });
      let finished = false;
      const next = () => {
        if (finished || run !== runRef.current) return;
        finished = true;
        later(() => playOne(at + 1), 550);
      };
      // The voice's own "end" event is unreliable on some phones, so the
      // estimated length is the backstop either way.
      later(next, elapsed + (canSpeak ? 900 : 200));
      say(SPEECH_LINES[line].text, rate);
    };
    playOne(0);
  };

  const finishLevel = () => {
    const total = SPEECH_LINES.length;
    const correct = Math.min(firstTryRef.current, total);
    const accuracy = correct / total;
    const starsEarned = accuracy === 1 ? 3 : accuracy >= 0.6 ? 2 : 1;
    const leveledUp = accuracy >= 0.6 && level < (activity?.levelCount ?? 3);
    onLevelComplete({ activityId, level, correct, total, starsEarned, leveledUp });
  };

  const goNext = () => {
    if (stepIndex + 1 >= steps.length) {
      finishLevel();
      return;
    }
    setStepIndex(stepIndex + 1);
  };

  // Entering a step: listen steps play straight away; say steps wait for her.
  useEffect(() => {
    missesRef.current = 0;
    helpedRef.current = false;
    setHeard([]);
    setNote('');
    if (step.kind === 'listen') {
      setPhase('playing');
      const intro = step.lines.length > 1 ? 'Now the whole speech. Listen!' : stepIndex === 0 ? 'Listen to Ellie.' : '';
      const begin = () => playLines(step.lines, () => later(goNext, 700));
      if (intro && canSpeak) {
        stopEverything();
        const run = runRef.current;
        say(intro, 0.9);
        later(() => run === runRef.current && begin(), 1900);
      } else {
        begin();
      }
    } else {
      stopEverything();
      setPhase('ready');
      setKaraoke(null);
      say(step.showText ? 'Your turn! Say it.' : onStage && stepIndex === 0 ? 'You are on stage! Say your speech.' : 'What comes next?');
    }
    // Only when the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const succeed = (firstTry: boolean) => {
    if (step.kind !== 'say' || phaseRef.current === 'success') return;
    stopEverything();
    if (firstTry && missesRef.current === 0 && !helpedRef.current) firstTryRef.current += 1;
    setHeard(LINE_WORDS[step.line].map(() => true));
    setDoneLines((prev) => (prev.includes(step.line) ? prev : [...prev, step.line]));
    setPhase('success');
    cheerAt(micRef.current);
    const last = stepIndex + 1 >= steps.length;
    if (last) celebrate(true);
    setNote(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    say(last && onStage ? `Hooray${childName ? `, ${childName}` : ''}! What a wonderful speech!` : PRAISE[Math.floor(Math.random() * PRAISE.length)]);
    later(goNext, last ? 2600 : 1700);
  };

  /** Plays the line again as help. The turn no longer counts as first-try. */
  const hearIt = () => {
    if (step.kind !== 'say' || phaseRef.current !== 'ready') return;
    helpedRef.current = true;
    setPhase('playing');
    setNote('');
    playLines([step.line], () => {
      setPhase('ready');
      say('Now you!');
    });
  };

  const listen = () => {
    if (step.kind !== 'say' || phaseRef.current !== 'ready') return;
    const Recognition = getRecognition();
    if (!Recognition) {
      setMicWorks(false);
      return;
    }
    stopEverything();
    const run = runRef.current;
    const line = step.line;
    let best: boolean[] = LINE_WORDS[line].map(() => false);
    let gotAnything = false;
    let denied = false;
    try {
      const recognition = new Recognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 3;
      recognition.onresult = (event) => {
        if (run !== runRef.current) return;
        gotAnything = true;
        // Any alternative of any result may have caught a word: keep them all.
        for (let r = 0; r < event.results.length; r++) {
          for (let a = 0; a < event.results[r].length; a++) {
            const hit = matchWords(line, event.results[r][a].transcript);
            best = best.map((b, i) => b || hit[i]);
          }
        }
        setHeard(best);
        if (best.filter(Boolean).length / best.length >= 0.6) succeed(true);
      };
      recognition.onerror = (event) => {
        if (run !== runRef.current) return;
        // Permission refused or no microphone: fall back to the tick button.
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
          denied = true;
          setMicWorks(false);
        }
      };
      recognition.onend = () => {
        if (run !== runRef.current) return;
        recognitionRef.current = null;
        if (phaseRef.current !== 'listening') return;
        if (denied) {
          setNote('Say it out loud, then tap the tick!');
          setPhase('ready');
          return;
        }
        missesRef.current += 1;
        setPhase('playing');
        if (missesRef.current >= 2) {
          // Never stuck: after two goes, hear it once more and move on.
          setNote('Good trying! Listen once more.');
          playLines([line], () => later(() => succeed(false), 300));
          return;
        }
        setNote(gotAnything ? 'Nearly! Listen, then try again.' : 'I could not hear you. Nice and loud!');
        playLines([line], () => setPhase('ready'));
      };
      recognitionRef.current = recognition;
      setHeard(best);
      setNote('I am listening…');
      setPhase('listening');
      recognition.start();
      burstFrom(micRef.current, 'sparkle');
    } catch {
      setMicWorks(false);
      setPhase('ready');
    }
  };

  if (!activity) return null;

  const visible = step.kind === 'listen' ? step.lines : step.visible;
  const activeLine = step.kind === 'say' ? step.line : (karaoke?.line ?? step.lines[0]);
  const mascotMood = phase === 'success' ? 'excited' : phase === 'listening' ? 'thinking' : phase === 'playing' ? 'happy' : 'encouraging';

  return (
    <div className={`speech ${onStage ? 'speech--stage' : ''}`}>
      <GameHeader
        title={activity.title}
        current={stepIndex + 1}
        total={steps.length}
        onBack={onExit}
        onHearPrompt={step.kind === 'say' ? hearIt : () => playLines(step.lines, () => later(goNext, 700))}
        speechSupported={canSpeak}
        childName={childName}
      />

      <div className="speech-body">
        {onStage && (
          <div className="speech-curtains" aria-hidden="true">
            <span className="speech-curtain speech-curtain--l" />
            <span className="speech-curtain speech-curtain--r" />
          </div>
        )}

        <div className="speech-top">
          <Mascot mood={mascotMood} size={96} />
          <p className="speech-note" key={note || phase} aria-live="polite">
            {note ||
              (phase === 'playing'
                ? 'Listen…'
                : step.kind === 'say'
                  ? micWorks
                    ? 'Tap the microphone and say it!'
                    : 'Say it out loud, then tap the tick!'
                  : '')}
          </p>
        </div>

        <div className="speech-lines">
          {visible.map((lineIndex) => {
            const isActive = lineIndex === activeLine;
            const isDone = doneLines.includes(lineIndex) && step.kind === 'say' && lineIndex !== step.line;
            const hideWords = step.kind === 'say' && !step.showText && !isDone;
            return (
              <div
                key={lineIndex}
                className={`speech-line ${isActive ? 'speech-line--active' : ''} ${isDone ? 'speech-line--done' : ''}`}
              >
                <span className="speech-cue" aria-hidden="true">
                  {SPEECH_LINES[lineIndex].cue}
                </span>
                <span className="speech-words">
                  {LINE_WORDS[lineIndex].map((word, w) => {
                    const speaking = karaoke?.line === lineIndex && karaoke.word === w;
                    const spoken = karaoke?.line === lineIndex && karaoke.word > w;
                    const wasHeard = isActive && step.kind === 'say' && heard[w];
                    // Hidden words show as blanks until she says them (or Ellie helps).
                    const blank = hideWords && !wasHeard && !speaking && !spoken;
                    return (
                      <span
                        key={w}
                        className={[
                          'speech-word',
                          speaking ? 'speech-word--now' : '',
                          spoken ? 'speech-word--spoken' : '',
                          wasHeard ? 'speech-word--heard' : '',
                          blank ? 'speech-word--blank' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {word}
                      </span>
                    );
                  })}
                </span>
              </div>
            );
          })}
        </div>

        {step.kind === 'say' && (
          <div className="speech-actions">
            <button type="button" className="speech-btn speech-btn--hear" onClick={hearIt} disabled={phase !== 'ready'}>
              <span aria-hidden="true">🔊</span> Hear it
            </button>
            {micWorks && (
              <button
                ref={micRef}
                type="button"
                className={`speech-mic ${phase === 'listening' ? 'speech-mic--on' : ''} ${phase === 'ready' ? 'speech-mic--ready' : ''}`}
                onClick={listen}
                disabled={phase !== 'ready'}
                aria-label="Tap and say the line"
              >
                <span aria-hidden="true">🎤</span>
              </button>
            )}
            <button
              ref={micWorks ? undefined : micRef}
              type="button"
              className={`speech-btn speech-btn--done ${!micWorks && phase === 'ready' ? 'speech-btn--pulse' : ''}`}
              onClick={() => succeed(true)}
              disabled={phase === 'success' || phase === 'playing'}
            >
              <span aria-hidden="true">✓</span> I said it
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
