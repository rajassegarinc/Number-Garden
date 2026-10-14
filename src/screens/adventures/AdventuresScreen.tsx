import MagicalForest from './MagicalForest.jsx';
import './MagicalForest.css';
import './AdventuresScreen.css';

interface AdventuresScreenProps {
  onBack: () => void;
}

export const AdventuresScreen = ({ onBack }: AdventuresScreenProps) => (
  <div className="adventures-screen">
    <MagicalForest onExit={onBack} />
  </div>
);
