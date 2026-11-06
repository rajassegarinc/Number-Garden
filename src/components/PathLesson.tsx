import { useEffect } from 'react';
import type { LessonSlide } from '../data/learningPaths';
import { LifeCycleWheel } from './PathScene';
import { LifeStageArt } from './LifeStageArt';
import './PathLesson.css';

interface PathLessonProps {
  slides: LessonSlide[];
  index: number;
  onIndexChange: (index: number) => void;
  onFinish: () => void;
  speak: (text: string) => void;
}

/** A teach-first picture lesson, one slide at a time, read aloud. The full
 * life-cycle picture stays on screen throughout so the child always sees
 * where the current stage fits. */
export const PathLesson = ({ slides, index, onIndexChange, onFinish, speak }: PathLessonProps) => {
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  useEffect(() => {
    speak(`${slide.title}. ${slide.text}`);
  }, [slide, speak]);

  return (
    <div className="path-lesson">
      <span className="path-lesson-badge">📖 Let’s learn first!</span>
      <h2 className="path-lesson-title">{slide.title}</h2>

      <LifeCycleWheel highlight={slide.stage} labels />

      {slide.stage && (
        <div className="path-lesson-closeup" key={slide.stage}>
          <LifeStageArt stage={slide.stage} size={96} />
        </div>
      )}

      <p className="path-lesson-text">{slide.text}</p>

      <div className="path-lesson-dots" aria-hidden="true">
        {slides.map((s, i) => (
          <span key={s.title} className={`path-lesson-dot ${i === index ? 'path-lesson-dot--on' : ''}`} />
        ))}
      </div>

      <div className="path-lesson-nav">
        <button
          type="button"
          className="path-lesson-btn path-lesson-btn--back"
          onClick={() => onIndexChange(index - 1)}
          disabled={index === 0}
        >
          ◀ Back
        </button>
        {isLast ? (
          <button type="button" className="path-lesson-btn path-lesson-btn--go" onClick={onFinish}>
            I’m ready for the quiz! 🦋
          </button>
        ) : (
          <button type="button" className="path-lesson-btn path-lesson-btn--next" onClick={() => onIndexChange(index + 1)}>
            Next ▶
          </button>
        )}
      </div>

      {!isLast && (
        <button type="button" className="path-lesson-skip" onClick={onFinish}>
          Skip to the quiz
        </button>
      )}
    </div>
  );
};
