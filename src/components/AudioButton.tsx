import './AudioButton.css';

interface AudioButtonProps {
  onPress: () => void;
  supported: boolean;
  label?: string;
  size?: 'md' | 'lg';
}

export const AudioButton = ({ onPress, supported, label = 'Hear it', size = 'md' }: AudioButtonProps) => (
  <button
    type="button"
    className={`audio-button audio-button--${size}`}
    onClick={onPress}
    disabled={!supported}
    aria-label={supported ? label : `${label} (audio not available on this device)`}
    title={supported ? label : 'Audio not available on this device'}
  >
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
      <path
        d="M4 9v6h4l5 5V4L8 9H4z"
        fill="currentColor"
      />
      {supported && (
        <path
          d="M16.5 8.5a5 5 0 010 7"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {supported && (
        <path
          d="M19 6a9 9 0 010 12"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
      )}
      {!supported && (
        <path d="M18 7l5 10M23 7l-5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  </button>
);
