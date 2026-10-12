export type AnimalKind =
  | 'lion'
  | 'tiger'
  | 'cheetah'
  | 'leopard'
  | 'elephant'
  | 'giraffe'
  | 'zebra'
  | 'hippo'
  | 'rhino'
  | 'monkey'
  | 'panda'
  | 'bear'
  | 'fox'
  | 'rabbit'
  | 'deer'
  | 'parrot'
  | 'toucan'
  | 'penguin'
  | 'flamingo'
  | 'crocodile';

export interface AnimalSpec {
  /** Short, friendly display name, e.g. for "Help the {name} find the answer!" */
  name: string;
  label: string;
  flagColor: string;
}

// Each species gets a fully bespoke full-body illustration in
// CelebrationAnimal.tsx (legs, arms/wings, tail, face — not a parametrized
// head icon), so this table only needs to carry the bits that don't vary
// the drawing itself: the display name, accessibility label, and flag color.
export const ANIMAL_SPECS: Record<AnimalKind, AnimalSpec> = {
  lion: { name: 'lion', label: 'a cheering cartoon lion with a mane, waving a flag', flagColor: '#ff6fa5' },
  tiger: { name: 'tiger', label: 'a cheering cartoon tiger with orange stripes, waving a flag', flagColor: '#ffb703' },
  cheetah: { name: 'cheetah', label: 'a cheering cartoon cheetah with spots and tear markings, waving a flag', flagColor: '#ffb703' },
  leopard: { name: 'leopard', label: 'a cheering cartoon leopard with rosette spots, waving a flag', flagColor: '#ff6fa5' },
  elephant: { name: 'elephant', label: 'a cheering cartoon elephant with big ears and a trunk, waving a flag', flagColor: '#2fa4e7' },
  giraffe: { name: 'giraffe', label: 'a cheering cartoon giraffe with a long spotted neck, waving a flag', flagColor: '#ffb703' },
  zebra: { name: 'zebra', label: 'a cheering cartoon zebra with black and white stripes, waving a flag', flagColor: '#4caf50' },
  hippo: { name: 'hippo', label: 'a cheering cartoon hippo with a wide round body, waving a flag', flagColor: '#9b6bdf' },
  rhino: { name: 'rhino', label: 'a cheering cartoon rhinoceros with a horn, waving a flag', flagColor: '#4caf50' },
  monkey: { name: 'monkey', label: 'a cheering cartoon monkey with a curly tail, waving a flag', flagColor: '#9b6bdf' },
  panda: { name: 'panda', label: 'a cheering cartoon panda with black and white fur, waving a flag', flagColor: '#4caf50' },
  bear: { name: 'bear', label: 'a cheering cartoon bear, waving a flag', flagColor: '#9b6bdf' },
  fox: { name: 'fox', label: 'a cheering cartoon fox with a bushy tail, waving a flag', flagColor: '#ef7f3c' },
  rabbit: { name: 'rabbit', label: 'a cheering cartoon rabbit with long ears, waving a flag', flagColor: '#ff9fc4' },
  deer: { name: 'deer', label: 'a cheering cartoon deer with small antlers, waving a flag', flagColor: '#4caf50' },
  parrot: { name: 'parrot', label: 'a cheering cartoon parrot with colorful feathers, waving a flag', flagColor: '#ff6fa5' },
  toucan: { name: 'toucan', label: 'a cheering cartoon toucan with a big colorful beak, waving a flag', flagColor: '#ffb703' },
  penguin: { name: 'penguin', label: 'a cheering cartoon penguin, waving a flag', flagColor: '#2fa4e7' },
  flamingo: { name: 'flamingo', label: 'a cheering cartoon flamingo with a long neck, waving a flag', flagColor: '#ff6fa5' },
  crocodile: { name: 'crocodile', label: 'a cheering cartoon crocodile, waving a flag', flagColor: '#4caf50' },
};

export const ANIMAL_KINDS: AnimalKind[] = Object.keys(ANIMAL_SPECS) as AnimalKind[];

export const isAnimalKind = (value: unknown): value is AnimalKind =>
  typeof value === 'string' && value in ANIMAL_SPECS;

/** Used if a persisted/selected kind ever doesn't match a known species
 * (e.g. older saved history data) — keeps rendering safe instead of
 * crashing on an unknown kind. */
export const FALLBACK_ANIMAL: AnimalKind = 'lion';
