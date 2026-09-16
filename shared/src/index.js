// Definitions the client and the server both rely on, kept in one place so
// they can't drift apart.

export { STATUS_OPTIONS } from './statuses.js';
export { PRIORITY_MIN, PRIORITY_MAX, applicationDefaults } from './application.js';
export {
  PASSWORD_MIN,
  PASSWORD_MAX,
  ACCOUNT_HEADER,
  DEMO_LIFETIME_HOURS,
  DEMO_LIFETIME_MS,
} from './account.js';
