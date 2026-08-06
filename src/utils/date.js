// Best-effort parser for the loose date strings used in the tracker,
// e.g. "3 Aug 2026", "Jul 2026", "31 Jul 2026", "" or "—".
// Returns a timestamp for sorting, or null when there's nothing usable.

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseTrackerDate(input) {
  if (!input) return null;
  const text = String(input).trim();
  if (!text || text === '—' || text === '-') return null;

  // ISO first: 2026-08-03
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  // "3 Aug 2026" / "31 July 2026"
  const dmy = text.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})$/);
  if (dmy) {
    const month = MONTHS[dmy[2].slice(0, 3).toLowerCase()];
    if (month === undefined) return null;
    return Date.UTC(Number(dmy[3]), month, Number(dmy[1]));
  }

  // "Aug 2026" / "July 2026" — treated as the 1st of the month so it sorts
  // ahead of dated entries in the same month.
  const my = text.match(/^([A-Za-z]{3,})\.?\s+(\d{4})$/);
  if (my) {
    const month = MONTHS[my[1].slice(0, 3).toLowerCase()];
    if (month === undefined) return null;
    return Date.UTC(Number(my[2]), month, 1);
  }

  const fallback = Date.parse(text);
  return Number.isNaN(fallback) ? null : fallback;
}
