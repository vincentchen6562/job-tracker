/**
 * The app runs on a weekly payday cycle (see jobs/paydayJob.js, scheduled for
 * Monday 00:05). "This period" for bill paid-status, spending totals, etc.
 * means "since the most recent Monday 00:00".
 */
export function startOfCurrentPeriod(now = new Date()) {
  const start = new Date(now);
  const day = start.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysSinceMonday = (day + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}
