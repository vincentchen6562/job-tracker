import Household from '../models/Household.js';

/**
 * Bills/balance/summary endpoints are teen-scoped. A teen always looks at
 * their own data; a parent must specify which teen (defaulting to the first
 * in the household, since the common case is one teen) and can only ever
 * resolve to a teen inside their own household.
 */
export async function resolveTeenId(req) {
  if (req.user.role === 'teen') return req.user.id;

  const household = await Household.findById(req.user.household, 'teens');
  const requested = req.query.teenId;
  const teenId = requested || household.teens[0]?.toString();

  if (!teenId) {
    const err = new Error('This household has no teen accounts yet.');
    err.status = 404;
    throw err;
  }
  if (!household.teens.some((t) => t.toString() === teenId)) {
    const err = new Error('That teen is not part of your household.');
    err.status = 403;
    throw err;
  }
  return teenId;
}
