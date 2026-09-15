// Length is the only rule for a password, so passphrases and password
// managers just work. The client shows it and the server enforces it.
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

// Carries the ID of the account a page is showing. Tabs share one cookie, so
// the server refuses a request whose session is for a different account.
export const ACCOUNT_HEADER = 'X-Account-Id';
