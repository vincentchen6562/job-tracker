import { useState } from 'react';

const LEVELS = [1, 2, 3, 4, 5];

export default function StarRating({ value = 0, onChange, label = 'Priority' }) {
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
          aria-label={`${level} of 5`}
          className={`star ${level <= shown ? 'star--on' : ''}`}
          onMouseEnter={() => setHover(level)}
          onFocus={() => setHover(level)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(value === level ? 0 : level)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
