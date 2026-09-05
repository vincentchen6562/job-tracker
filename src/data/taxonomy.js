// Facets for the search and filter bar.
//
// None of the saved applications carry a category, role type, or location
// field — the seed data predates them and so does anything already in
// localStorage. So each facet is *inferred* from the text an application
// already has: the role title first, then company, notes and markdown detail.
// Anything set explicitly on the application overrides the guess, which is
// what the selects on the detail page write. See resolveFacets.

export const UNSPECIFIED = 'Unspecified';

export const CATEGORY_OPTIONS = [
  'Software development',
  'Quality engineering',
  'Data & analytics',
  'DevOps & infrastructure',
  'Security',
  'IT support & systems',
  'Business & analysis',
  'Design & UX',
  'Sales & marketing',
  'Finance & accounting',
  'Other engineering',
  UNSPECIFIED,
];

export const ROLE_TYPE_OPTIONS = [
  'Graduate programme',
  'Internship',
  'Full-time',
  'Part-time',
  'Contract',
  'Casual',
  UNSPECIFIED,
];

// Major NZ centres, roughly north to south, plus the two catch-alls.
export const LOCATION_OPTIONS = [
  'Auckland',
  'Hamilton',
  'Tauranga',
  'Rotorua',
  'Napier',
  'Palmerston North',
  'Wellington',
  'Nelson',
  'Christchurch',
  'Queenstown',
  'Dunedin',
  'Invercargill',
  'Remote',
  UNSPECIFIED,
];

// Ordered most specific first — the first rule that matches wins, so
// "Test Automation Engineer" lands on quality engineering rather than
// software development.
const CATEGORY_RULES = [
  [
    'Quality engineering',
    /\b(qa|sdet|tester|testers|quality (engineer\w*|assurance|analyst)|test (engineer\w*|analyst|automation|lead))\b/,
  ],
  [
    'Data & analytics',
    /\b(data (scien\w+|analyst|engineer\w*|warehouse)|machine learning|\bml engineer|analytics|business intelligence|\bbi developer)\b/,
  ],
  [
    'DevOps & infrastructure',
    /\b(devops|site reliability|\bsre\b|platform engineer\w*|cloud engineer\w*|infrastructure|network engineer\w*|systems engineer\w*)\b/,
  ],
  ['Security', /\b(security|cyber\w*|infosec|penetration test\w*)\b/],
  [
    'IT support & systems',
    /\b(help ?desk|service desk|it support|technical support|desktop support|applications? (specialist|support|analyst)|systems? admin\w*|sysadmin)\b/,
  ],
  [
    'Software development',
    /\b(software|developer|programmer|full[- ]?stack|front[- ]?end|back[- ]?end|web dev\w*|mobile dev\w*|android|ios engineer)\b/,
  ],
  [
    'Business & analysis',
    /\b(business analyst|systems analyst|product (owner|manager)|project (manager|coordinator)|scrum master|consultant)\b/,
  ],
  ['Design & UX', /\b(ux|ui designer|user experience|product design\w*|graphic design\w*)\b/],
  [
    'Sales & marketing',
    /\b(sales|account (manager|executive)|business development|marketing|customer success|retail assistant)\b/,
  ],
  [
    'Finance & accounting',
    /\b(accountant|accounting|finance|financial analyst|audit\w*|payroll)\b/,
  ],
  [
    'Other engineering',
    /\b(mechanical|electrical|civil|structural|chemical|geotechnical) engineer\w*\b/,
  ],
];

// "graduate" on its own is too loose — ads say things like "welcomes recent
// graduates" without being a grad programme — so outside the role title it
// only counts when paired with programme/scheme.
const ROLE_TYPE_RULES = [
  ['Internship', /\b(intern|interns|internship|summer intern\w*|work placement)\b/],
  ['Graduate programme', /\b(grad|graduate)s? (programme|program|scheme|role|pathway)\b/],
  ['Part-time', /\bpart[- ]?time\b/],
  ['Casual', /\bcasual\b/],
  ['Contract', /\b(contract|contracting|fixed[- ]?term|temporary)\b/],
  ['Full-time', /\bfull[- ]?time\b/],
];

// City names only, no regions — "University of Canterbury" in a cover letter
// should not tag an Auckland job as Christchurch.
const LOCATION_RULES = [
  ['Auckland', /\b(auckland|tāmaki makaurau|tamaki makaurau)\b/],
  ['Hamilton', /\b(hamilton|kirikiriroa)\b/],
  ['Tauranga', /\b(tauranga|mount maunganui)\b/],
  ['Rotorua', /\brotorua\b/],
  ['Napier', /\b(napier|hastings)\b/],
  ['Palmerston North', /\bpalmerston north\b/],
  ['Wellington', /\b(wellington|te whanganui[- ]a[- ]tara|lower hutt|porirua)\b/],
  ['Nelson', /\bnelson\b/],
  ['Christchurch', /\b(christchurch|[ōo]tautahi)\b/],
  ['Queenstown', /\b(queenstown|wanaka|w[āa]naka)\b/],
  ['Dunedin', /\b(dunedin|[ōo]tepoti)\b/],
  ['Invercargill', /\binvercargill\b/],
  ['Remote', /\b(fully remote|remote[- ]first|work from anywhere|100% remote)\b/],
];

function haystack(...parts) {
  return parts
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase();
}

function firstMatch(rules, text) {
  if (!text.trim()) return null;
  const hit = rules.find(([, pattern]) => pattern.test(text));
  return hit ? hit[0] : null;
}

export function deriveCategory(app) {
  const role = haystack(app.role);
  const everything = haystack(app.role, app.notes, app.detail);
  // Role title is the strongest signal, so try it on its own before letting
  // the body text vote.
  return firstMatch(CATEGORY_RULES, role) ?? firstMatch(CATEGORY_RULES, everything) ?? UNSPECIFIED;
}

export function deriveRoleType(app) {
  const role = haystack(app.role);
  // A grad programme is often only named in the title, e.g. "(2026 Grad
  // Programme)", so check the bare word there before the stricter rule.
  if (/\bgrad(uate)?s?\b/.test(role)) return 'Graduate programme';
  const everything = haystack(app.role, app.notes, app.detail);
  return firstMatch(ROLE_TYPE_RULES, role) ?? firstMatch(ROLE_TYPE_RULES, everything) ?? UNSPECIFIED;
}

// An ad can legitimately name two cities ("Auckland or Christchurch"), so
// this returns every centre it finds rather than the first.
export function deriveLocations(app) {
  const everything = haystack(app.company, app.role, app.notes, app.detail);
  if (!everything.trim()) return [UNSPECIFIED];
  const found = LOCATION_RULES.filter(([, pattern]) => pattern.test(everything)).map(
    ([label]) => label
  );
  return found.length ? found : [UNSPECIFIED];
}

// Explicit values win; an empty string means "let the text decide".
export function resolveFacets(app) {
  const category = app.category || deriveCategory(app);
  const roleType = app.roleType || deriveRoleType(app);
  const locations = app.location ? [app.location] : deriveLocations(app);

  return {
    category,
    roleType,
    locations,
    categoryIsAuto: !app.category,
    roleTypeIsAuto: !app.roleType,
    locationIsAuto: !app.location,
  };
}
