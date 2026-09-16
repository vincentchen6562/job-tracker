import express from 'express';
import { applicationModel, pickFields, publicApplication } from './applications.js';
import { demoExpiry, requireLogin } from './sessions.js';

// Version 2 backups carry attachments as base64 text, so a backup can be far
// bigger than any other request. The attachments are dropped, but the file
// still has to be read.
const BACKUP_SIZE_LIMIT = '50mb';

// MongoDB's error code when a write breaks a unique index.
const DUPLICATE_KEY = 11000;

const NOT_A_BACKUP = { error: "That file isn't a tracker backup." };

// Version 1 backups were a bare list of applications. Version 2 was an object
// holding the applications and, from when the tracker had attachments, the
// files too. Version 3 is the same object with no attachments. These are the
// versions that come as an object.
const OBJECT_VERSIONS = [2, 3];

// The one-line summary used to be stored as `notes`, and the markdown details
// as `detail` (ADR-0011).
const RENAMED_FIELDS = { notes: 'summary', detail: 'details' };

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// The applications in a backup of any version, as the file holds them, or
// null when it isn't a backup the tracker made. Anything else in the file,
// attachments included, is left behind.
function backupApplications(backup) {
  const applications = Array.isArray(backup)
    ? backup
    : OBJECT_VERSIONS.includes(backup.version) && backup.applications;
  if (!Array.isArray(applications) || !applications.every(isObject)) return null;
  return applications;
}

// An application from a backup of any version, in the current shape. Old
// field names take their new ones, and everything the schema doesn't know is
// dropped, attachment stubs included (ADR-0009). The schema fills in the
// fields it's missing. Every tracker has given its applications ids, and the
// server never makes one up (ADR-0007), so an application without one is
// refused by the schema.
function convertApplication(application) {
  const renamed = { ...application };
  Object.entries(RENAMED_FIELDS).forEach(([from, to]) => {
    // A value already under the new name wins.
    if (from in renamed && !(to in renamed)) renamed[to] = renamed[from];
  });
  // Before locations were tags, an application had one location as text.
  if (renamed.location && !renamed.locations) renamed.locations = [renamed.location];
  return { ...pickFields(renamed), id: application.id };
}

// Mounted before the app's own body parser, so the backup is read with its
// larger limit, and only once the request is known to be logged in.
export function createRestoreRouter(db) {
  const Application = applicationModel(db);
  const router = express.Router();

  router.use(requireLogin);
  router.use(express.json({ limit: BACKUP_SIZE_LIMIT }));

  // Replaces all of the account's applications with the backup's in one
  // transaction, so a file that fails partway leaves the account as it was.
  router.post('/', async (req, res) => {
    const applications = backupApplications(req.body);
    if (!applications) return res.status(400).json(NOT_A_BACKUP);

    const { accountId } = req.session;
    // A demo can restore a backup too, and what it restores expires with it.
    const expiresAt = demoExpiry(req);
    let restored;
    try {
      restored = await db.transaction(async (session) => {
        await Application.deleteMany({ accountId }, { session });
        return Application.insertMany(
          applications.map((application) => ({
            ...convertApplication(application),
            accountId,
            expiresAt,
          })),
          { session },
        );
      });
    } catch (error) {
      if (error.code !== DUPLICATE_KEY) throw error;
      return res.status(400).json({ error: 'The backup has two applications with the same id.' });
    }
    res.json(restored.map(publicApplication));
  });

  // The body parser's own messages talk about JSON, not backups.
  router.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json(NOT_A_BACKUP);
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'That backup is too large to restore.' });
    }
    next(error);
  });

  return router;
}
