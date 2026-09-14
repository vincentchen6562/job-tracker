# Hand-built email and password auth

We build email and password login ourselves (bcrypt, Express) instead of using a hosted login service like Clerk or Auth0. Building the security-sensitive part is the point of the project (ADR-0001), even though a hosted service would be faster and safer.

## Considered Options

- **Hosted login service (Clerk, Auth0):** rejected because it hides exactly the part the project exists to demonstrate.
- **Google sign-in only (Passport):** rejected for v1 because the app would still need its own session handling while teaching less. It may be added alongside email and password later.

## Consequences

Forgotten passwords and email verification both need an email provider, so neither is in v1. Until they are, an admin script resets a password. v1 account features are sign up, log in, log out, change password, and delete account.
