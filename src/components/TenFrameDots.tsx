import './TenFrameDots.css';

const ROW_A = [1, 2, 3, 4, 5];
const ROW_B = [6, 7, 8, 9, 10];

interface TenFrameDotsProps {
  /** The number this frame represents — determines the final filled count. */
  value: number;
  /** How many dots are filled right now, 0-10. Defaults to `value` (fully
   * filled); a counting demo animates this up from 0 separately from `value`
   * so the frame's shape (which row breaks where) stays fixed while the
   * fill animates. */
  litCount?: number;
  size?: 'sm' | 'lg';
}

export const TenFrameDots = ({ value, litCount, size = 'sm' }: TenFrameDotsProps) => {
  const lit = litCount ?? value;
  return (
    <div className={`ten-frame ten-frame--${size}`} aria-hidden="true">
      <div className="ten-frame-row">
        {ROW_A.map((n) => (
          <span key={n} className={`ten-frame-dot ${n <= lit ? 'ten-frame-dot--filled-a' : ''}`} />
        ))}
      </div>
      <div className="ten-frame-row">
        {ROW_B.map((n) => (
          <span key={n} className={`ten-frame-dot ${n <= lit ? 'ten-frame-dot--filled-b' : ''}`} />
        ))}
      </div>
    </div>
  );
};
