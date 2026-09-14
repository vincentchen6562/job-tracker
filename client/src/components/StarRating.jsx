import { useState } from 'react';
import { PRIORITY_MIN, PRIORITY_MAX } from '@job-tracker/shared';

// One star per rated level; the unrated minimum has no star of its own.
const LEVELS = Array.from(
  { length: PRIORITY_MAX - PRIORITY_MIN },
  (_, index) => PRIORITY_MIN + index + 1
);

export default function StarRating({ value = PRIORITY_MIN, onChange, label = 'Priority' }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      className="stars"
      role="radiogroup"
      aria-label={label}
      onMouseLeave={() => setHover(0)}
    >
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          aria-label={`${level} of ${PRIORITY_MAX}`}
          className={`star ${level <= shown ? 'star--on' : ''}`}
          onMouseEnter={() => setHover(level)}
          onFocus={() => setHover(level)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(value === level ? PRIORITY_MIN : level)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
