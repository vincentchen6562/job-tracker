# Remove CV and cover letter attachments

Commit `ecd25d4` added CV and cover letter uploads, stored in the browser's IndexedDB. We remove them before the backend lands: the upload code, the CV / cover letter badges, and attachments in backups. Restore ignores the `cv`, `coverLetter` and `attachments` fields in older backups. Attachments were the most expensive feature in the plan for what they gave. The files already live in the owner's documents, sent email and application portals. And with open sign-up (ADR-0005), storing files means hosting whatever strangers upload on free storage. To point at a file, put a link in an application's Details.

## Considered Options

- **Keep them on the device, syncing only the metadata:** rejected. Other devices would show a CV they can't open. Each account would need its own IndexedDB database. A cleanup running before the server data arrives would delete every file. And deleting an account would leave CVs behind on other devices.
- **Store them on the server (GridFS or object storage) with size limits:** rejected for now. It needs a second storage path, access checks on downloads, per-account limits and abuse handling, all for a convenience.
- **Two link fields ("CV link", "Cover letter link"):** rejected. A link in Details already does the job, and a link points at a live document, which may no longer match what was sent.

## Consequences

If attachments are missed after using the synced tracker, they come back as a new feature built on object storage, not by reverting this.
