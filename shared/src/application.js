import { STATUS_OPTIONS } from './statuses.js';

// Priority is a star rating; zero means not yet rated.
export const PRIORITY_MIN = 0;
export const PRIORITY_MAX = 5;

// Every field of an application apart from its id, with the value a new one
// starts with. A function rather than a constant so each application gets its
// own `locations` array.
export function applicationDefaults() {
  return {
    company: '',
    role: '',
    status: STATUS_OPTIONS[0],
    date: '',
    priority: PRIORITY_MIN,
    jobPostingUrl: '',
    summary: '',
    details: '',
    // Empty means "infer from the role, summary and details".
    category: '',
    roleType: '',
    locations: [],
  };
}
