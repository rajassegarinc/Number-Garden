import type { AnimalKind } from './celebrationAnimals';
import type { CardColor, MissionId } from '../types';

export interface MissionMeta {
  id: MissionId;
  title: string;
  shortTitle: string;
  blurb: string;
  color: CardColor;
  guide: AnimalKind;
  emoji: string;
}

// The three Animal Rescue Adventure missions. Each is always unlocked (no
// gating) per the "allow free exploration" requirement, and each is
// independently replayable.
export const MISSIONS: MissionMeta[] = [
  {
    id: 'banana',
    title: "Monkey's Bananas",
    shortTitle: 'Bananas',
    blurb: 'Help the monkey collect bananas!',
    color: 'yellow',
    guide: 'monkey',
    emoji: '🍌',
  },
  {
    id: 'river',
    title: "Baby Elephant's River",
    shortTitle: 'River Crossing',
    blurb: 'Hop across the stones to find mother!',
    color: 'blue',
    guide: 'elephant',
    emoji: '🐾',
  },
  {
    id: 'eggs',
    title: "Bird's Nest",
    shortTitle: 'Bird Eggs',
    blurb: "Fill the nest with the bird's eggs!",
    color: 'green',
    guide: 'parrot',
    emoji: '🥚',
  },
];

export const getMission = (id: string): MissionMeta | undefined =>
  MISSIONS.find((mission) => mission.id === id);
