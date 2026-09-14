import { useRef, useState } from 'react';

// A text box that turns what you type into removable tags. Enter or a comma
// commits, backspace on an empty box takes the last one back, and blur
// commits whatever is left in the box so a typed value is never lost.
export default function TagInput({
  id,
  values,
  suggestions = [],
  placeholder,
  ariaLabel,
  onChange,
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const listId = `${id}-suggestions`;

  function add(raw) {
    const incoming = String(raw)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (incoming.length === 0) {
      setDraft('');
      return;
    }

    const next = [...values];
    incoming.forEach((tag) => {
      const taken = next.some((existing) => existing.toLowerCase() === tag.toLowerCase());
      if (!taken) next.push(tag);
    });

    setDraft('');
    if (next.length !== values.length) onChange(next);
  }

  function removeAt(index) {
    onChange(values.filter((_, i) => i !== index));
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
    } else if (event.key === 'Backspace' && draft === '' && values.length > 0) {
      removeAt(values.length - 1);
    }
  }

  function handleChange(event) {
    const text = event.target.value;
    // Covers a paste of "Auckland, Wellington" and picking from the datalist.
    if (text.includes(',')) add(text);
    else setDraft(text);
  }

  const unused = suggestions.filter(
    (option) => !values.some((tag) => tag.toLowerCase() === option.toLowerCase())
  );

  return (
    <div
      className="tag-input"
      onMouseDown={(event) => {
        // Clicking the padding should land in the text box, but let the
        // remove buttons handle their own clicks.
        if (event.target === event.currentTarget) {
          event.preventDefault();
          inputRef.current?.focus();
        }
      }}
    >
      {values.map((tag, index) => (
        <span className="tag" key={`${tag}-${index}`}>
          {tag}
          <button
            type="button"
            className="tag__remove"
            aria-label={`Remove ${tag}`}
            title={`Remove ${tag}`}
            onClick={() => removeAt(index)}
          >
            ✕
          </button>
        </span>
      ))}

      <input
        id={id}
        ref={inputRef}
        className="tag-input__field"
        type="text"
        list={listId}
        value={draft}
        placeholder={values.length ? 'Add another…' : placeholder}
        aria-label={ariaLabel}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => add(draft)}
      />

      <datalist id={listId}>
        {unused.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}
