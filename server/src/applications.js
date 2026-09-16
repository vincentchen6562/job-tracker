import {
  PRIORITY_MAX,
  PRIORITY_MIN,
  STATUS_OPTIONS,
  applicationDefaults,
} from '@job-tracker/shared';
import express from 'express';
import mongoose from 'mongoose';
import { demoExpiry, requireLogin } from './sessions.js';

// Every field the browser edits, as the shared package defines them. Only
// these are ever written or sent back.
const DEFAULTS = applicationDefaults();
const FIELDS = Object.keys(DEFAULTS);

// The rules beyond a field's type, for the fields that have them.
const FIELD_RULES = {
  status: { enum: STATUS_OPTIONS },
  priority: {
    min: PRIORITY_MIN,
    max: PRIORITY_MAX,
    validate: { validator: Number.isInteger, message: 'Priority must be a whole number.' },
  },
};

// A field's type and default, taken from its shared default.
function typeFor(value) {
  if (Array.isArray(value)) return { type: [String], default: () => [] };
  if (typeof value === 'number') return { type: Number, default: value };
  return { type: String, default: value };
}

// A schema path for each field: its type, default and any rules.
function fieldDefinitions() {
  return Object.fromEntries(
    Object.entries(DEFAULTS).map(([field, value]) => [
      field,
      { ...typeFor(value), ...FIELD_RULES[field] },
    ]),
  );
}

const applicationSchema = new mongoose.Schema(
  {
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Made by the browser, so it only has to be unique within one account
    // (ADR-0007).
    id: { type: String, required: true },
    // Set only on a demo account's applications, so they go when it does
    // (ADR-0005). Not one of the browser's fields, so it's never sent back
    // and a request can't set it.
    expiresAt: { type: Date },
    ...fieldDefinitions(),
  },
  // Mongoose's own `id` virtual would shadow the browser's `id` field.
  { id: false, timestamps: true },
);

applicationSchema.index({ accountId: 1, id: 1 }, { unique: true });

// The same TTL index as the accounts have, so a demo's applications go when
// it does. A real account's applications have no expiry and are left alone.
applicationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Looked up per connection, like the account model, since each test file
// brings its own.
export function applicationModel(db) {
  return db.models.Application ?? db.model('Application', applicationSchema);
}

// The application as the browser holds it: its id and its fields, nothing
// about which account owns it.
export function publicApplication(application) {
  return Object.fromEntries([
    ['id', application.id],
    ...FIELDS.map((field) => [field, application[field]]),
  ]);
}

// The known fields present in a request body. Anything else is dropped.
export function pickFields(body) {
  return Object.fromEntries(
    FIELDS.filter((field) => field in body).map((field) => [field, body[field]]),
  );
}

// The application named in the URL, looked for only within the logged-in
// account. Another account's application and a missing one look the same on
// purpose.
function ownApplication(req) {
  return { accountId: req.session.accountId, id: req.params.id };
}

const NOT_FOUND = { error: 'Application not found.' };

export function createApplicationsRouter(db) {
  const Application = applicationModel(db);
  const router = express.Router();

  // Sets the body's known fields on the application in the URL, creating it
  // first when `create` is set. Resolves with the saved application, or null
  // when there's none to change.
  function saveFields(req, { create }) {
    const expiresAt = demoExpiry(req);
    return Application.findOneAndUpdate(
      ownApplication(req),
      {
        $set: pickFields(req.body),
        // Only as it's created, and only in a demo: an application takes the
        // expiry of the account it's added to, so nothing outlives the demo.
        ...(expiresAt && { $setOnInsert: { expiresAt } }),
      },
      { upsert: create, returnDocument: 'after', runValidators: true, sanitizeFilter: true },
    );
  }

  // Without it, a logged-out PUT would upsert an application with no owner.
  router.use(requireLogin);

  router.get('/', async (req, res) => {
    // A restore saves many applications in the same instant, so `_id` breaks
    // the tie and they keep the backup's order.
    const applications = await Application.find({ accountId: req.session.accountId }).sort({
      createdAt: 1,
      _id: 1,
    });
    res.json(applications.map(publicApplication));
  });

  // Creates the application if it's new, otherwise merges the given fields,
  // so the browser's first save can be retried safely (ADR-0007).
  router.put('/:id', async (req, res) => {
    res.json(publicApplication(await saveFields(req, { create: true })));
  });

  // Autosave sends only the fields that changed, so edits to different
  // fields from two devices both survive (ADR-0008). Never creates: that's
  // PUT's job.
  router.patch('/:id', async (req, res) => {
    const application = await saveFields(req, { create: false });
    if (!application) return res.status(404).json(NOT_FOUND);
    res.json(publicApplication(application));
  });

  router.delete('/:id', async (req, res) => {
    const { deletedCount } = await Application.deleteOne(ownApplication(req), {
      sanitizeFilter: true,
    });
    if (deletedCount === 0) return res.status(404).json(NOT_FOUND);
    res.status(204).end();
  });

  return router;
}
