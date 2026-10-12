import type { Screen } from '../types';
import './BottomNavigation.css';

interface BottomNavigationProps {
  screen: Screen;
  soundOn: boolean;
  onHome: () => void;
  onProgress: () => void;
  onToggleSound: () => void;
}

export const BottomNavigation = ({
  screen,
  soundOn,
  onHome,
  onProgress,
  onToggleSound,
}: BottomNavigationProps) => {
  const items = [
    {
      key: 'home' as const,
      label: 'Home',
      active: screen === 'home',
      onClick: onHome,
      icon: (
        <path
          d="M4 11l8-7 8 7M6 10v9h12v-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      key: 'progress' as const,
      label: 'Progress',
      active: screen === 'parent',
      onClick: onProgress,
      icon: (
        <path
          d="M6 4h12v4a6 6 0 01-12 0V4zM9 14v3M15 14v3M8 20h8M5 5H3v2a4 4 0 004 4M19 5h2v2a4 4 0 01-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`bottom-nav-item ${item.active ? 'bottom-nav-item--active' : ''}`}
          onClick={item.onClick}
          aria-current={item.active ? 'page' : undefined}
        >
          <span className="bottom-nav-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              {item.icon}
            </svg>
          </span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}

      <button
        type="button"
        className="bottom-nav-item"
        onClick={onToggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
      >
        <span className="bottom-nav-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
            {soundOn ? (
              <path
                d="M17 8.5a5 5 0 010 7"
                stroke="currentColor"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
            ) : (
              <path d="M18 8l5 8M23 8l-5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </span>
        <span className="bottom-nav-label">Sound</span>
      </button>
    </nav>
  );
};
