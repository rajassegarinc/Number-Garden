import { ANIMAL_SPECS } from '../data/celebrationAnimals';
import type { AnimalKind } from '../data/celebrationAnimals';
import './CelebrationAnimal.css';

export type CelebrationPose = 'bounce' | 'wave' | 'jump';

interface VictoryFlagProps {
  color: string;
  flip?: boolean;
}

export const VictoryFlag = ({ color, flip }: VictoryFlagProps) => (
  <svg
    className={`celebration-flag ${flip ? 'celebration-flag--flip' : ''}`}
    viewBox="0 0 40 50"
    width="100%"
    height="100%"
    aria-hidden="true"
  >
    <line x1="4" y1="46" x2="4" y2="4" stroke="#8a5a32" strokeWidth="3" strokeLinecap="round" />
    <path d="M4 6 L36 14 L4 24 Z" fill={color} />
    <path
      d="M10 12l1.6 3.3 3.6.5-2.6 2.6.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.6 3.6-.5z"
      fill="#ffffff"
      opacity="0.85"
    />
  </svg>
);

// --- Shared body-part fragments, reused across species so every animal has
// the same construction quality (legs that reach the ground, a torso, two
// arms, a face) and only the species-specific markup changes what sits on
// top of that rig. ---

const Shadow = () => <ellipse cx="80" cy="222" rx="46" ry="8" fill="#1f6fb2" opacity="0.12" />;

const Legs = ({ body, foot }: { body: string; foot: string }) => (
  <>
    <rect x="50" y="168" width="22" height="46" rx="11" fill={body} />
    <rect x="88" y="168" width="22" height="46" rx="11" fill={body} />
    <ellipse cx="61" cy="216" rx="15" ry="9" fill={foot} />
    <ellipse cx="99" cy="216" rx="15" ry="9" fill={foot} />
  </>
);

const Face = ({ eyeSpacing = 13 }: { eyeSpacing?: number }) => (
  <>
    <circle cx={80 - eyeSpacing} cy="68" r="7" fill="#2f3a4a" />
    <circle cx={80 + eyeSpacing} cy="68" r="7" fill="#2f3a4a" />
    <circle cx={80 - eyeSpacing + 2} cy="65.5" r="2.2" fill="#fff" />
    <circle cx={80 + eyeSpacing + 2} cy="65.5" r="2.2" fill="#fff" />
    <path d="M70 84q10 8 20 0" stroke="#2f3a4a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
  </>
);

// --- Bird rig: thin legs instead of mammal legs, a wing standing in for the
// flag-holding arm, and eyes without the mammal muzzle/smile (birds get a
// beak instead) — reused by the 4 bird species below. ---

const BirdLegs = ({ color = '#ffb703' }: { color?: string }) => (
  <>
    <rect x="70" y="180" width="6" height="32" rx="3" fill={color} />
    <rect x="84" y="180" width="6" height="32" rx="3" fill={color} />
    <path d="M62 212l8-6M70 212l0-8M70 212l8-6" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M82 212l8-6M90 212l0-8M90 212l8-6" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
  </>
);

const BirdEyes = ({ spacing = 11 }: { spacing?: number }) => (
  <>
    <circle cx={80 - spacing} cy="74" r="6" fill="#2f3a4a" />
    <circle cx={80 + spacing} cy="74" r="6" fill="#2f3a4a" />
    <circle cx={80 - spacing + 1.8} cy="72" r="1.8" fill="#fff" />
    <circle cx={80 + spacing + 1.8} cy="72" r="1.8" fill="#fff" />
  </>
);

interface CelebrationAnimalProps {
  kind: AnimalKind;
  pose?: CelebrationPose;
  flip?: boolean;
  size?: number;
  delayIndex?: number;
}

export const CelebrationAnimal = ({
  kind,
  pose = 'bounce',
  flip = false,
  size = 108,
  delayIndex = 0,
}: CelebrationAnimalProps) => {
  const spec = ANIMAL_SPECS[kind];

  return (
    <div
      className={`celebration-animal celebration-animal--${pose}`}
      style={{ width: size, height: size * 1.44, animationDelay: `${(delayIndex % 4) * 0.12}s` }}
      role="img"
      aria-label={spec.label}
    >
      <svg
        viewBox="0 0 160 230"
        width="100%"
        height="100%"
        style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      >
        {kind === 'lion' && (
          <>
            <Shadow />
            <Legs body="#e8a63e" foot="#c97a1f" />
            <path d="M118 150c20 2 30 14 26 24-3 8-14 10-22 4" fill="none" stroke="#c97a1f" strokeWidth="7" strokeLinecap="round" />
            <circle cx="140" cy="178" r="8" fill="#c97a1f" />
            <ellipse cx="80" cy="140" rx="48" ry="44" fill="#e8a63e" />
            {Array.from({ length: 14 }).map((_, i) => {
              const angle = (i / 14) * Math.PI * 2;
              const r = 46;
              const cx = 80 + Math.cos(angle) * r;
              const cy = 72 + Math.sin(angle) * r;
              return <ellipse key={i} cx={cx} cy={cy} rx="15" ry="11" fill={i % 2 === 0 ? '#c97a1f' : '#b5731f'} />;
            })}
            <circle cx="80" cy="72" r="38" fill="#e8a63e" />
            <ellipse cx="54" cy="46" rx="11" ry="11" fill="#f7cf7e" />
            <ellipse cx="106" cy="46" rx="11" ry="11" fill="#f7cf7e" />
            <ellipse cx="80" cy="86" rx="22" ry="17" fill="#fff3df" />
            <ellipse cx="124" cy="112" rx="13" ry="23" fill="#e8a63e" transform="rotate(18 124 112)" />
            <Face eyeSpacing={13} />
            <path d="M74 92q6 5 12 0" stroke="#c97a1f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </>
        )}

        {kind === 'elephant' && (
          <>
            <Shadow />
            <Legs body="#5ec1f5" foot="#4fb0ea" />
            <ellipse cx="80" cy="140" rx="50" ry="46" fill="#5ec1f5" stroke="#2f8fd1" strokeWidth="3" />
            <ellipse cx="38" cy="78" rx="24" ry="30" fill="#4fb0ea" stroke="#2f8fd1" strokeWidth="3" />
            <ellipse cx="122" cy="78" rx="24" ry="30" fill="#4fb0ea" stroke="#2f8fd1" strokeWidth="3" />
            <ellipse cx="38" cy="80" rx="13" ry="18" fill="#eaf8ff" />
            <ellipse cx="122" cy="80" rx="13" ry="18" fill="#eaf8ff" />
            <circle cx="80" cy="76" r="36" fill="#5ec1f5" stroke="#2f8fd1" strokeWidth="3" />
            <path
              d="M80 92c0 0-5 14-2 28 1.5 11 10 17 16 14s6-12 2-18"
              fill="#5ec1f5"
              stroke="#2f8fd1"
              strokeWidth="3.4"
              strokeLinejoin="round"
              className="celebration-trunk"
            />
            <path d="M68 96q-4 8 0 14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M92 96q4 8 0 14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="126" cy="112" rx="13" ry="23" fill="#5ec1f5" stroke="#2f8fd1" strokeWidth="3" transform="rotate(18 126 112)" />
            <Face eyeSpacing={16} />
          </>
        )}

        {kind === 'giraffe' && (
          <>
            <Shadow />
            <Legs body="#f2c75c" foot="#e0ad3c" />
            <path d="M60 186c0-30 2-70 4-100 1-14 4-26 6-34" fill="none" stroke="#f2c75c" strokeWidth="26" strokeLinecap="round" />
            <path d="M100 186c0-30-2-70-4-100-1-14-4-26-6-34" fill="none" stroke="#f2c75c" strokeWidth="26" strokeLinecap="round" />
            {[[58, 150], [102, 160], [66, 108], [94, 98], [72, 70], [88, 58]].map(([cx, cy], i) => (
              <ellipse key={i} cx={cx} cy={cy} rx="7" ry="6" fill="#c9822a" />
            ))}
            <ellipse cx="80" cy="140" rx="44" ry="40" fill="#f2c75c" />
            <circle cx="80" cy="42" r="30" fill="#f2c75c" />
            <ellipse cx="62" cy="28" rx="8" ry="8" fill="#f2c75c" />
            <ellipse cx="98" cy="28" rx="8" ry="8" fill="#f2c75c" />
            <circle cx="62" cy="16" r="6" fill="#c9822a" />
            <circle cx="98" cy="16" r="6" fill="#c9822a" />
            <ellipse cx="80" cy="54" rx="17" ry="13" fill="#fff3df" />
            <ellipse cx="124" cy="112" rx="12" ry="21" fill="#f2c75c" transform="rotate(18 124 112)" />
            <circle cx="68" cy="40" r="6" fill="#2f3a4a" />
            <circle cx="92" cy="40" r="6" fill="#2f3a4a" />
            <circle cx="69.5" cy="38" r="1.8" fill="#fff" />
            <circle cx="93.5" cy="38" r="1.8" fill="#fff" />
            <path d="M70 56q10 7 20 0" stroke="#2f3a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}

        {kind === 'zebra' && (
          <>
            <Shadow />
            <Legs body="#f4f4f4" foot="#e3e3e3" />
            <path d="M54 170l0 42M68 170l0 42M92 170l0 42M106 170l0 42" stroke="#2f3a4a" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
            <ellipse cx="80" cy="140" rx="48" ry="44" fill="#f4f4f4" />
            <path
              d="M38 118q10 10 4 28M46 108q12 10 6 30M54 98q14 12 8 34M64 92q14 12 10 36M118 118q-10 10-4 28M110 108q-12 10-6 30M102 98q-14 12-8 34"
              fill="none"
              stroke="#2f3a4a"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle cx="80" cy="72" r="36" fill="#f4f4f4" />
            <ellipse cx="56" cy="44" rx="11" ry="15" fill="#f4f4f4" />
            <ellipse cx="104" cy="44" rx="11" ry="15" fill="#f4f4f4" />
            <ellipse cx="56" cy="48" rx="6" ry="9" fill="#2f3a4a" opacity="0.7" />
            <ellipse cx="104" cy="48" rx="6" ry="9" fill="#2f3a4a" opacity="0.7" />
            {[[62, 36], [72, 30], [88, 30], [98, 36]].map(([cx, cy], i) => (
              <path key={i} d={`M${cx - 5} ${cy + 6} L${cx} ${cy - 6} L${cx + 5} ${cy + 6} Z`} fill="#2f3a4a" />
            ))}
            <ellipse cx="80" cy="86" rx="21" ry="16" fill="#fff" />
            <ellipse cx="124" cy="112" rx="13" ry="23" fill="#f4f4f4" transform="rotate(18 124 112)" />
            <Face eyeSpacing={13} />
          </>
        )}

        {kind === 'tiger' && (
          <>
            <Shadow />
            <Legs body="#f4a93c" foot="#e08a1f" />
            <path d="M118 150c20 2 28 14 24 24-3 8-13 10-20 4" fill="none" stroke="#e08a1f" strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="80" cy="140" rx="48" ry="44" fill="#f4a93c" />
            <path
              d="M42 108q10 12 2 26M54 96q12 14 4 32M98 96q-12 14-4 32M110 108q-10 12-2 26M66 162q1 14-1 24M94 162q-1 14 1 24"
              fill="none"
              stroke="#8a4a12"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path d="M42 24 L58 14 L60 46 Z" fill="#f4a93c" />
            <path d="M118 24 L102 14 L100 46 Z" fill="#f4a93c" />
            <path d="M46 24 L56 19 L57 40 Z" fill="#fcd49b" />
            <path d="M114 24 L104 19 L103 40 Z" fill="#fcd49b" />
            <circle cx="80" cy="72" r="38" fill="#f4a93c" />
            <path d="M58 42q10 10 2 24M102 42q-10 10-2 24M70 32q4 10 0 20M90 32q-4 10 0 20" stroke="#8a4a12" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="80" cy="86" rx="25" ry="19" fill="#fff3df" />
            <path d="M38 80q8 4 2 12M122 80q-8 4-2 12" stroke="#8a4a12" strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <ellipse cx="124" cy="112" rx="13" ry="23" fill="#f4a93c" transform="rotate(18 124 112)" />
            <Face eyeSpacing={14} />
            <path d="M50 88 L30 84M50 92 L28 92M50 96 L30 100" stroke="#8a4a12" strokeWidth="1.6" opacity="0.6" strokeLinecap="round" />
            <path d="M110 88 L130 84M110 92 L132 92M110 96 L130 100" stroke="#8a4a12" strokeWidth="1.6" opacity="0.6" strokeLinecap="round" />
          </>
        )}

        {kind === 'panda' && (
          <>
            <Shadow />
            <Legs body="#fbfbfb" foot="#2f3a4a" />
            <path d="M120 150c18 3 26 14 22 23-3 7-12 9-19 3" fill="none" stroke="#fbfbfb" strokeWidth="9" strokeLinecap="round" />
            <ellipse cx="80" cy="142" rx="50" ry="46" fill="#fbfbfb" />
            <circle cx="80" cy="74" r="38" fill="#fbfbfb" />
            <ellipse cx="54" cy="46" rx="13" ry="13" fill="#2f3a4a" />
            <ellipse cx="106" cy="46" rx="13" ry="13" fill="#2f3a4a" />
            <ellipse cx="62" cy="72" rx="15" ry="19" fill="#2f3a4a" opacity="0.92" />
            <ellipse cx="98" cy="72" rx="15" ry="19" fill="#2f3a4a" opacity="0.92" />
            <ellipse cx="80" cy="88" rx="22" ry="16" fill="#fff" />
            <ellipse cx="128" cy="114" rx="13" ry="23" fill="#fbfbfb" transform="rotate(18 128 114)" />
            <circle cx="62" cy="72" r="6.5" fill="#fff" />
            <circle cx="98" cy="72" r="6.5" fill="#fff" />
            <circle cx="62" cy="72" r="3.6" fill="#2f3a4a" />
            <circle cx="98" cy="72" r="3.6" fill="#2f3a4a" />
            <path d="M70 92q10 7 20 0" stroke="#2f3a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}

        {kind === 'monkey' && (
          <>
            <Shadow />
            <path
              d="M96 160q26 4 30 26q2 14-10 18q-10 3-14-8"
              fill="none"
              stroke="#c98a52"
              strokeWidth="10"
              strokeLinecap="round"
              className="celebration-tail"
            />
            <Legs body="#c98a52" foot="#8a5a32" />
            <ellipse cx="80" cy="142" rx="42" ry="40" fill="#c98a52" />
            <ellipse cx="80" cy="150" rx="24" ry="20" fill="#e8bd8d" />
            <circle cx="80" cy="76" r="34" fill="#c98a52" />
            <ellipse cx="50" cy="64" rx="13" ry="13" fill="#e8bd8d" />
            <ellipse cx="110" cy="64" rx="13" ry="13" fill="#e8bd8d" />
            <ellipse cx="80" cy="88" rx="22" ry="17" fill="#e8bd8d" />
            <ellipse cx="34" cy="128" rx="12" ry="22" fill="#c98a52" transform="rotate(-18 34 128)" />
            <ellipse cx="124" cy="110" rx="12" ry="22" fill="#c98a52" transform="rotate(20 124 110)" />
            <Face eyeSpacing={12} />
          </>
        )}

        {kind === 'cheetah' && (
          <>
            <Shadow />
            <Legs body="#f5c16c" foot="#e0a84a" />
            <path d="M118 150c18 3 26 14 22 23-3 7-12 9-19 3" fill="none" stroke="#e0a84a" strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="80" cy="140" rx="46" ry="42" fill="#f5c16c" />
            {[[50, 118], [62, 108], [98, 108], [110, 118], [58, 150], [102, 150], [70, 164], [90, 164]].map(
              ([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4.4" fill="#5a3a1a" />
              ),
            )}
            {/* Small rounded ears (not pointed) — cheetahs have a distinctly
            different silhouette from leopard/tiger's pointed ears. */}
            <ellipse cx="52" cy="46" rx="10" ry="10" fill="#f5c16c" />
            <ellipse cx="108" cy="46" rx="10" ry="10" fill="#f5c16c" />
            <circle cx="80" cy="70" r="36" fill="#f5c16c" />
            {[[58, 50], [66, 44], [94, 44], [102, 50]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="3.6" fill="#5a3a1a" />
            ))}
            <ellipse cx="80" cy="84" rx="22" ry="17" fill="#fff3df" />
            {/* Bold black "tear marks" from the eyes to the mouth — the
            signature cheetah facial feature. */}
            <path d="M67 72q-5 12 -3 22" stroke="#2f2015" strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <path d="M93 72q5 12 3 22" stroke="#2f2015" strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <ellipse cx="122" cy="110" rx="13" ry="22" fill="#f5c16c" transform="rotate(18 122 110)" />
            <Face eyeSpacing={13} />
          </>
        )}

        {kind === 'leopard' && (
          <>
            <Shadow />
            <Legs body="#e8b65a" foot="#c9972f" />
            <path d="M118 150c18 3 26 14 22 23-3 7-12 9-19 3" fill="none" stroke="#c9972f" strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="80" cy="140" rx="46" ry="42" fill="#e8b65a" />
            {[[50, 118], [64, 106], [98, 106], [112, 118], [56, 150], [104, 150], [72, 166], [88, 166]].map(
              ([cx, cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="5.2" fill="none" stroke="#6b4a1f" strokeWidth="2.2" />
                  <circle cx={cx + 1.4} cy={cy + 1.4} r="1.6" fill="#6b4a1f" />
                </g>
              ),
            )}
            <ellipse cx="54" cy="46" rx="11" ry="11" fill="#fcd49b" />
            <ellipse cx="106" cy="46" rx="11" ry="11" fill="#fcd49b" />
            <circle cx="80" cy="72" r="38" fill="#e8b65a" />
            {[[58, 50], [102, 50]].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="4.6" fill="none" stroke="#6b4a1f" strokeWidth="2" />
              </g>
            ))}
            <ellipse cx="80" cy="86" rx="22" ry="17" fill="#fff3df" />
            <ellipse cx="124" cy="112" rx="13" ry="23" fill="#e8b65a" transform="rotate(18 124 112)" />
            <Face eyeSpacing={13} />
          </>
        )}

        {kind === 'hippo' && (
          <>
            <Shadow />
            <Legs body="#8a93a6" foot="#6f7890" />
            <ellipse cx="80" cy="146" rx="54" ry="46" fill="#8a93a6" />
            <circle cx="80" cy="78" r="40" fill="#8a93a6" />
            <ellipse cx="48" cy="56" rx="9" ry="9" fill="#6f7890" />
            <ellipse cx="112" cy="56" rx="9" ry="9" fill="#6f7890" />
            <ellipse cx="80" cy="98" rx="30" ry="20" fill="#aab2c2" />
            <ellipse cx="68" cy="102" rx="4" ry="5" fill="#5a6278" />
            <ellipse cx="92" cy="102" rx="4" ry="5" fill="#5a6278" />
            <ellipse cx="128" cy="118" rx="14" ry="23" fill="#8a93a6" transform="rotate(18 128 118)" />
            <Face eyeSpacing={18} />
          </>
        )}

        {kind === 'rhino' && (
          <>
            <Shadow />
            <Legs body="#9aa3ad" foot="#7c8591" />
            <ellipse cx="80" cy="144" rx="50" ry="44" fill="#9aa3ad" />
            <circle cx="80" cy="76" r="38" fill="#9aa3ad" />
            <ellipse cx="50" cy="54" rx="8" ry="10" fill="#7c8591" />
            <ellipse cx="110" cy="54" rx="8" ry="10" fill="#7c8591" />
            <ellipse cx="80" cy="96" rx="24" ry="16" fill="#aab3bd" />
            <path d="M80 100 L70 76 L90 86 Z" fill="#e8e4da" stroke="#c9cdd4" strokeWidth="1.5" strokeLinejoin="round" />
            <ellipse cx="124" cy="112" rx="13" ry="23" fill="#9aa3ad" transform="rotate(18 124 112)" />
            <Face eyeSpacing={16} />
          </>
        )}

        {kind === 'bear' && (
          <>
            <Shadow />
            <Legs body="#8a5a36" foot="#6b4324" />
            <ellipse cx="80" cy="142" rx="48" ry="44" fill="#8a5a36" />
            <circle cx="80" cy="74" r="38" fill="#8a5a36" />
            <ellipse cx="52" cy="48" rx="13" ry="13" fill="#6b4324" />
            <ellipse cx="108" cy="48" rx="13" ry="13" fill="#6b4324" />
            <ellipse cx="80" cy="88" rx="23" ry="17" fill="#c9955f" />
            <ellipse cx="80" cy="90" rx="5" ry="4" fill="#3a2414" />
            <ellipse cx="124" cy="112" rx="13" ry="23" fill="#8a5a36" transform="rotate(18 124 112)" />
            <Face eyeSpacing={14} />
          </>
        )}

        {kind === 'fox' && (
          <>
            <Shadow />
            <path d="M112 160q22 6 26 26q2 12-10 16q-10 3-16-6" fill="#ef7f3c" className="celebration-tail" />
            <ellipse cx="134" cy="192" rx="9" ry="9" fill="#fff" />
            <Legs body="#ef7f3c" foot="#c6611f" />
            <ellipse cx="80" cy="142" rx="46" ry="42" fill="#ef7f3c" />
            <ellipse cx="80" cy="156" rx="24" ry="20" fill="#fff6ea" />
            <path d="M46 24 L60 12 L62 44 Z" fill="#ef7f3c" />
            <path d="M114 24 L100 12 L98 44 Z" fill="#ef7f3c" />
            <path d="M48 20 L58 16 L58 32 Z" fill="#2f3a4a" />
            <path d="M112 20 L102 16 L102 32 Z" fill="#2f3a4a" />
            <circle cx="80" cy="72" r="36" fill="#ef7f3c" />
            <path d="M80 78 L64 96 L96 96 Z" fill="#fff6ea" />
            <ellipse cx="80" cy="96" rx="4" ry="3.2" fill="#2f3a4a" />
            <ellipse cx="122" cy="112" rx="12" ry="21" fill="#ef7f3c" transform="rotate(18 122 112)" />
            <Face eyeSpacing={13} />
          </>
        )}

        {kind === 'rabbit' && (
          <>
            <Shadow />
            <circle cx="124" cy="166" r="11" fill="#fff" />
            <Legs body="#ffffff" foot="#ffd2e6" />
            <ellipse cx="80" cy="144" rx="44" ry="42" fill="#ffffff" />
            <ellipse cx="54" cy="24" rx="12" ry="34" fill="#ffffff" stroke="#f3cfe0" strokeWidth="2" />
            <ellipse cx="106" cy="24" rx="12" ry="34" fill="#ffffff" stroke="#f3cfe0" strokeWidth="2" />
            <ellipse cx="54" cy="24" rx="6" ry="24" fill="#ffd2e6" />
            <ellipse cx="106" cy="24" rx="6" ry="24" fill="#ffd2e6" />
            <circle cx="80" cy="76" r="36" fill="#ffffff" />
            <ellipse cx="80" cy="90" rx="22" ry="16" fill="#fff6ea" />
            <ellipse cx="80" cy="88" rx="4" ry="3.2" fill="#ff8fc0" />
            <ellipse cx="122" cy="112" rx="12" ry="21" fill="#ffffff" transform="rotate(18 122 112)" />
            <Face eyeSpacing={13} />
          </>
        )}

        {kind === 'deer' && (
          <>
            <Shadow />
            <Legs body="#c9955f" foot="#a87442" />
            <ellipse cx="80" cy="142" rx="46" ry="42" fill="#c9955f" />
            {[[58, 130], [100, 126], [68, 154], [92, 158]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="4.2" fill="#fff3df" />
            ))}
            <path d="M58 34 Q50 14 38 16M58 34 Q62 16 70 12" stroke="#8a5a32" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M102 34 Q110 14 122 16M102 34 Q98 16 90 12" stroke="#8a5a32" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="54" cy="52" rx="10" ry="14" fill="#e8bd8d" transform="rotate(-18 54 52)" />
            <ellipse cx="106" cy="52" rx="10" ry="14" fill="#e8bd8d" transform="rotate(18 106 52)" />
            <circle cx="80" cy="74" r="34" fill="#c9955f" />
            <ellipse cx="80" cy="90" rx="20" ry="15" fill="#fff3df" />
            <ellipse cx="124" cy="112" rx="12" ry="21" fill="#c9955f" transform="rotate(18 124 112)" />
            <Face eyeSpacing={12} />
          </>
        )}

        {kind === 'parrot' && (
          <>
            <Shadow />
            <path d="M110 150q20 10 14 34q-4 14-18 10q-8-3-6-14" fill="#ff6fa5" />
            <BirdLegs color="#ffb703" />
            <ellipse cx="80" cy="148" rx="36" ry="46" fill="#4caf50" />
            <ellipse cx="80" cy="166" rx="18" ry="22" fill="#ffd84a" />
            <circle cx="80" cy="76" r="32" fill="#4caf50" />
            <path d="M80 86 Q96 92 92 106 Q82 112 72 100 Z" fill="#ef7f3c" />
            <BirdEyes spacing={11} />
            <ellipse cx="118" cy="110" rx="13" ry="20" fill="#2fa4e7" transform="rotate(22 118 110)" />
          </>
        )}

        {kind === 'toucan' && (
          <>
            <Shadow />
            <BirdLegs color="#ffb703" />
            <ellipse cx="80" cy="150" rx="34" ry="46" fill="#2f3a4a" />
            <ellipse cx="80" cy="170" rx="16" ry="20" fill="#ffffff" />
            <circle cx="86" cy="76" r="30" fill="#2f3a4a" />
            <path d="M86 70 Q130 60 132 82 Q130 96 100 92 Z" fill="#ffb703" />
            <path d="M100 92 Q110 96 100 100 Z" fill="#ef7f3c" />
            <circle cx="74" cy="70" r="6" fill="#fff" />
            <circle cx="75.5" cy="68.5" r="3.4" fill="#2f3a4a" />
            <ellipse cx="116" cy="112" rx="12" ry="20" fill="#2f3a4a" transform="rotate(20 116 112)" />
          </>
        )}

        {kind === 'penguin' && (
          <>
            <Shadow />
            <ellipse cx="68" cy="212" rx="12" ry="6" fill="#ffb703" />
            <ellipse cx="92" cy="212" rx="12" ry="6" fill="#ffb703" />
            <ellipse cx="80" cy="146" rx="42" ry="48" fill="#2f3a4a" />
            <ellipse cx="80" cy="156" rx="26" ry="36" fill="#ffffff" />
            <circle cx="80" cy="74" r="34" fill="#2f3a4a" />
            <ellipse cx="80" cy="82" rx="18" ry="16" fill="#ffffff" />
            <path d="M80 86 L70 94 L90 94 Z" fill="#ffb703" />
            <BirdEyes spacing={10} />
            <ellipse cx="122" cy="118" rx="12" ry="26" fill="#2f3a4a" transform="rotate(22 122 118)" />
          </>
        )}

        {kind === 'flamingo' && (
          <>
            <Shadow />
            <rect x="70" y="170" width="7" height="42" rx="3.5" fill="#ff8fc0" />
            <rect x="86" y="170" width="7" height="42" rx="3.5" fill="#ff8fc0" />
            <path d="M62 212l8-6M70 212l0-8M70 212l8-6" stroke="#ff8fc0" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M82 212l8-6M90 212l0-8M90 212l8-6" stroke="#ff8fc0" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="80" cy="160" rx="32" ry="30" fill="#ffb3d9" />
            <path d="M80 132 Q64 100 72 60" fill="none" stroke="#ffb3d9" strokeWidth="18" strokeLinecap="round" />
            <circle cx="72" cy="52" r="26" fill="#ffb3d9" />
            <path d="M72 58 Q50 64 46 74 Q54 80 68 70 Z" fill="#2f3a4a" />
            <circle cx="80" cy="46" r="5" fill="#2f3a4a" />
            <circle cx="81.4" cy="44.4" r="1.6" fill="#fff" />
            <ellipse cx="108" cy="96" rx="11" ry="20" fill="#ffb3d9" transform="rotate(18 108 96)" />
          </>
        )}

        {kind === 'crocodile' && (
          <>
            <Shadow />
            <path d="M30 170q-24 4-26 22q-2 11 9 13q9 1 12-8" fill="#4caf50" className="celebration-tail" />
            <Legs body="#4caf50" foot="#3d8b40" />
            <ellipse cx="80" cy="146" rx="46" ry="40" fill="#4caf50" />
            <ellipse cx="80" cy="158" rx="24" ry="16" fill="#bdeab8" />
            <circle cx="68" cy="78" r="30" fill="#4caf50" />
            <path d="M90 70 Q140 66 144 80 Q142 92 108 90 L96 96 L90 84 Z" fill="#4caf50" />
            <path d="M100 74l4 10M112 72l4 11M124 72l4 11M136 74l3 10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <ellipse cx="68" cy="92" rx="16" ry="12" fill="#bdeab8" />
            <circle cx="58" cy="52" r="9" fill="#4caf50" />
            <circle cx="78" cy="48" r="9" fill="#4caf50" />
            <circle cx="58" cy="50" r="3.6" fill="#2f3a4a" />
            <circle cx="78" cy="46" r="3.6" fill="#2f3a4a" />
            <ellipse cx="122" cy="112" rx="13" ry="22" fill="#4caf50" transform="rotate(18 122 112)" />
          </>
        )}
      </svg>
      <div className="celebration-animal-flag-slot">
        <VictoryFlag color={spec.flagColor} flip={flip} />
      </div>
    </div>
  );
};
