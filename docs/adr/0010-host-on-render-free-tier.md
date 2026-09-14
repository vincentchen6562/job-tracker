# Host on Render's free tier

The Express server, which also serves the React build (ADR-0004), runs as a Render free web service, with data in a MongoDB Atlas M0 cluster. As of September 2026, Render was the only credible host that is free, needs no card, and runs a normal long-lived Express process with a Mongo-backed session store unchanged.

## Considered Options

- **Northflank Sandbox:** never sleeps, but needs a card on file.
- **Vercel Hobby:** Express runs as a serverless function, so the React build would have to move to `public/` and database connections need special handling.
- **Koyeb, Fly.io, Railway, Netlify, Cloudflare Workers:** ruled out. Koyeb is closing its free tier, Fly.io has none, Railway's free plan allows no custom domains, Netlify can pause every site, and the MongoDB driver doesn't run on Workers.

## Consequences

- **Sleep and wake:** the service sleeps after 15 minutes without requests and takes about a minute to wake.
- **Suspension risk:** Render suspends free services for the rest of the month if usage goes over the free allowance, so the account should hold only this one service.
- **Atlas network access:** free hosts have no fixed outbound IP, so Atlas has to accept connections from `0.0.0.0/0`, protected by a strong database password.
- **Front door page:** the public link (the one on CVs and the portfolio) points to a static page on GitHub Pages, not directly at Render. It shows "Waking the server…", pings `/api/health`, and redirects once the server responds. It needs no login cookie, so ADR-0004 still holds. Because the front door URL gets printed on CVs, it must stay stable even if the host changes.
- **Keeping it awake:** rejected. An external pinger would use 744 of the 750 free hours, leaving no room for a second service, and Render may not allow it.
