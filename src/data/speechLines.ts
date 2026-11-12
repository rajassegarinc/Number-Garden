/**
 * The lines practised in "My Speech". To practise a different speech (a
 * rhyme, a self-introduction, another school programme), change the title
 * and the lines here: everything else adapts.
 *
 * `cue` is the picture that stands for the line once the words are hidden,
 * so a child who cannot read yet still has something to remember it by.
 * `sounds` lists other spellings the speech recogniser may hear for a word.
 */
export interface SpeechLine {
  text: string;
  cue: string;
}

export const SPEECH_TITLE = 'My Karnataka Speech';

export const SPEECH_LINES: SpeechLine[] = [
  { text: 'Karnataka is a beautiful state in India.', cue: '🌄' },
  { text: 'Bengaluru is the capital of Karnataka.', cue: '🏛️' },
  { text: 'I love Karnataka!', cue: '❤️' },
];

/** Words the recogniser often hears differently; any of these counts. */
export const SOUND_ALIKES: Record<string, string[]> = {
  karnataka: ['karnatak', 'carnatic', 'karnatka', 'karnatic'],
  bengaluru: ['bangalore', 'bengalore', 'bangaluru', 'bengaluroo'],
  capital: ['capitol'],
  state: ['estate'],
  i: ['eye', 'hi'],
};
