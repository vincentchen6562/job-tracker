# One origin for the app and the API

Express serves both the built React app and `/api/*` from one origin. That makes the session cookie first-party with `SameSite=Lax` and removes the need for CORS.

## Considered Options

- **Frontend on a static host, API elsewhere:** the page would load instantly even while a free-tier API server wakes up. It was rejected because the session cookie becomes a third-party cookie, which some browsers already block (Safari) and which needs `SameSite=None`, CORS setup, and a shared custom domain to work reliably.

## Consequences

When a free host has put the server to sleep, the whole page waits for it to wake. The app can't show its own "waking up" screen during that wait, because the HTML itself comes from the sleeping server.
