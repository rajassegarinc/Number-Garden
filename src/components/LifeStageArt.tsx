import type { LifeStage } from '../data/learningPaths';

const LABELS: Record<LifeStage, string> = {
  egg: 'tiny butterfly eggs on a leaf',
  caterpillar: 'a green caterpillar on a leaf',
  chrysalis: 'a chrysalis hanging from a twig',
  butterfly: 'an orange butterfly',
};

const Leaf = () => (
  <g>
    <path d="M10,70 Q50,30 92,62 Q52,96 10,70 Z" fill="#7bd97e" stroke="#4caf50" strokeWidth="3" />
    <path d="M14,70 Q52,64 88,63" fill="none" stroke="#4caf50" strokeWidth="2" />
  </g>
);

/** Hand-drawn SVG for each butterfly life stage — emoji don't cover the egg
 * or chrysalis, so all four are drawn to keep one consistent style. */
export const LifeStageArt = ({ stage, size = 120 }: { stage: LifeStage; size?: number }) => {
  let art;
  switch (stage) {
    case 'egg':
      art = (
        <>
          <Leaf />
          {[38, 50, 62].map((x, i) => (
            <ellipse key={x} cx={x} cy={64 - (i % 2) * 4} rx="5" ry="7" fill="#fff6cf" stroke="#c9b26b" strokeWidth="1.5" />
          ))}
        </>
      );
      break;
    case 'caterpillar':
      art = (
        <>
          <Leaf />
          {[24, 34, 44, 54, 64].map((x, i) => (
            <circle key={x} cx={x} cy={58 - (i % 2) * 3} r="7" fill={i % 2 ? '#8bc34a' : '#4caf50'} stroke="#2e7d32" strokeWidth="1.5" />
          ))}
          <circle cx="75" cy="52" r="9" fill="#ffb703" stroke="#c97a1f" strokeWidth="1.5" />
          <circle cx="78" cy="50" r="1.8" fill="#2f3a4a" />
          <path d="M72,44 L68,36 M78,43 L80,35" stroke="#2f3a4a" strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
      break;
    case 'chrysalis':
      art = (
        <>
          <path d="M14,14 L86,18" stroke="#8a6a3c" strokeWidth="5" strokeLinecap="round" />
          <path d="M50,17 L50,26" stroke="#8a6a3c" strokeWidth="2" />
          <path d="M50,26 C64,34 66,62 50,88 C34,62 36,34 50,26 Z" fill="#7bd97e" stroke="#2e7d32" strokeWidth="3" />
          <path d="M42,44 Q50,48 58,44" fill="none" stroke="#ffb703" strokeWidth="2.5" strokeLinecap="round" />
          {[44, 50, 56].map((x) => (
            <circle key={x} cx={x} cy="36" r="1.8" fill="#ffb703" />
          ))}
        </>
      );
      break;
    case 'butterfly':
      art = (
        <>
          <ellipse cx="32" cy="38" rx="22" ry="20" fill="#ff9f1c" stroke="#2f3a4a" strokeWidth="3" transform="rotate(-20 32 38)" />
          <ellipse cx="68" cy="38" rx="22" ry="20" fill="#ff9f1c" stroke="#2f3a4a" strokeWidth="3" transform="rotate(20 68 38)" />
          <ellipse cx="36" cy="68" rx="14" ry="13" fill="#ffb703" stroke="#2f3a4a" strokeWidth="3" />
          <ellipse cx="64" cy="68" rx="14" ry="13" fill="#ffb703" stroke="#2f3a4a" strokeWidth="3" />
          {[[24, 34], [76, 34], [34, 70], [66, 70]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#ffffff" />
          ))}
          <rect x="46" y="28" width="8" height="54" rx="4" fill="#2f3a4a" />
          <path d="M48,30 Q42,16 36,12 M52,30 Q58,16 64,12" fill="none" stroke="#2f3a4a" strokeWidth="2" strokeLinecap="round" />
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={LABELS[stage]}>
      {art}
    </svg>
  );
};
