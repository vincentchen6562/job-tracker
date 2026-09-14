# Login required, with a temporary demo account per visitor

The tracker can't be used without logging in. Visitors who just want to look (mostly recruiters following a portfolio link) press "Try the demo". That creates a new temporary account loaded with seed data and logs them in. A MongoDB TTL index deletes the account and its data after 24 hours.

## Considered Options

- **A logged-out guest mode backed by localStorage:** rejected because it would mean two storage paths and a migration between them, when the demo already removes the need to sign up.
- **One shared demo account reset on a schedule:** rejected because visitors would see and vandalise each other's changes, and resetting it needs a scheduled job that free hosts may not provide.

## Consequences

Reset to seed data is only offered in demo accounts, and new real accounts start empty. Signing up from a demo creates a new account; the demo's changes don't carry over. Creating demo accounts is rate-limited per IP.
