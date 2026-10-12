import './Stars.css';

interface StarBadgeProps {
  count: number;
}

export const StarBadge = ({ count }: StarBadgeProps) => (
  <div className="star-badge" role="status" aria-label={`${count} stars earned`}>
    <span className="star-badge-icon" aria-hidden="true">
      ⭐
    </span>
    <span className="star-badge-count">{count}</span>
  </div>
);

interface StarRowProps {
  earned: number;
  total?: number;
  size?: number;
}

export const StarRow = ({ earned, total = 3, size = 34 }: StarRowProps) => (
  <div className="star-row" role="img" aria-label={`${earned} out of ${total} stars`}>
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className={`star-row-item ${i < earned ? 'star-row-item--filled' : ''}`}
        style={{ fontSize: size, animationDelay: `${i * 0.12}s` }}
        aria-hidden="true"
      >
        ⭐
      </span>
    ))}
  </div>
);
