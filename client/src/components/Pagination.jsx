// First and last pages are always reachable; the rest of the strip is a
// window around the current page, with an ellipsis standing in for the gap.
function pageList(current, pageCount) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => ({
      page: index + 1,
      key: index + 1,
    }));
  }

  const wanted = [1, 2, current - 1, current, current + 1, pageCount - 1, pageCount];
  const shown = [...new Set(wanted)]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((a, b) => a - b);

  const strip = [];
  shown.forEach((page, index) => {
    if (index > 0 && page - shown[index - 1] > 1) strip.push({ gap: true, key: `gap-${page}` });
    strip.push({ page, key: page });
  });
  return strip;
}

export default function Pagination({ page, pageCount, total, pageSize, onChange }) {
  if (pageCount <= 1) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const items = pageList(page, pageCount);

  return (
    <nav className="pagination" aria-label="Pages">
      <p className="pagination__range">
        {first}–{last} of {total}
      </p>

      <div className="pagination__controls">
        <button
          type="button"
          className="btn pagination__step"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          ←
        </button>

        {items.map((item) =>
          item.gap ? (
            <span key={item.key} className="pagination__gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item.key}
              type="button"
              className={`btn pagination__page ${
                item.page === page ? 'pagination__page--on' : ''
              }`}
              aria-label={`Page ${item.page}`}
              aria-current={item.page === page ? 'page' : undefined}
              onClick={() => onChange(item.page)}
            >
              {item.page}
            </button>
          )
        )}

        <button
          type="button"
          className="btn pagination__step"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </nav>
  );
}
