# The browser generates application IDs

When an application is added, the browser generates its ID with `crypto.randomUUID()`. The server stores that ID with a unique index per account and doesn't hand out its own ID for applications to use. The pending-application flow (focusing the new row, scrolling to it, holding it out of the sort) needs the ID at the moment of creation. Waiting for the server to assign one would mean swapping a temporary ID for the real one in state, refs, and the URL. Seed data can keep readable IDs, because uniqueness only has to hold within an account.

A new application reaches the server on its first edit, not when **Add application** is clicked. The first autosave is a `PUT /api/applications/:id` that creates the application if it doesn't exist, rather than a `POST`. An application that is added and never typed into leaves nothing behind.
