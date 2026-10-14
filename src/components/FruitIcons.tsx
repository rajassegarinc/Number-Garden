// Small, lightweight inline-SVG fruit/basket art shared across Monkey's
// Bananas, the garden's ambient banana tree, and Little Market — one set of
// assets instead of three near-duplicates.

export const BananaIcon = () => (
  <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
    <path
      d="M14 6c6 2 18 10 18 24 0 8-7 13-15 11-6-1.5-10-7-10-14"
      fill="none"
      stroke="#8a5a32"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M14 7c5 1 17 9 17 23 0 7-6 11-13 9.5C11.5 38 8 33 8 27"
      fill="#ffd34d"
      stroke="#e8a63e"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const AppleIcon = () => (
  <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
    <path d="M24 10c2-4 6-5 8-3" fill="none" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" />
    <path
      d="M24 14c10 0 16 8 16 17 0 9-7 15-16 15s-16-6-16-15c0-9 6-17 16-17z"
      fill="#ff6b6b"
      stroke="#d64545"
      strokeWidth="2"
    />
    <ellipse cx="18" cy="24" rx="4" ry="6" fill="#ffffff" opacity="0.35" />
  </svg>
);

export const OrangeIcon = () => (
  <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
    <path d="M24 10v4" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="24" cy="26" r="16" fill="#ffb703" stroke="#e08a1f" strokeWidth="2" />
    <ellipse cx="18" cy="20" rx="4" ry="5" fill="#ffffff" opacity="0.3" />
  </svg>
);

interface BasketIconProps {
  filled: number;
  target: number;
  fillColor?: string;
  strokeColor?: string;
}

export const BasketIcon = ({ filled, target, fillColor = '#ffd34d', strokeColor = '#e8a63e' }: BasketIconProps) => (
  <svg viewBox="0 0 90 70" width="86" height="68" aria-hidden="true">
    <path d="M12 28h66l-8 34a8 8 0 01-8 6H28a8 8 0 01-8-6z" fill="#e8a63e" stroke="#8a5a32" strokeWidth="2.5" />
    <path d="M10 28h70" stroke="#8a5a32" strokeWidth="4" strokeLinecap="round" />
    <path d="M20 28c2-10 10-16 25-16s23 6 25 16" fill="none" stroke="#8a5a32" strokeWidth="3" />
    <path d="M22 34l3 24M38 34l1 26M52 34l-1 26M68 34l-3 24" stroke="#c97a1f" strokeWidth="2" opacity="0.6" />
    {Array.from({ length: filled }).map((_, i) => (
      <ellipse
        key={i}
        cx={30 + (i % 3) * 14}
        cy={44 - Math.floor(i / 3) * 10}
        rx="9"
        ry="5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.4"
        transform={`rotate(${(i % 3) * 20 - 20} ${30 + (i % 3) * 14} ${44 - Math.floor(i / 3) * 10})`}
      />
    ))}
    <title>{`${filled} of ${target}`}</title>
  </svg>
);
