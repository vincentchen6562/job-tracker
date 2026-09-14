// Applications saved by older versions of the tracker carry fields it no
// longer has. Everything read from storage or a backup passes through here,
// so the applications in memory are always the current shape.

// The one-line summary used to be stored as `notes`, and the markdown
// details as `detail` (ADR-0011).
const RENAMED_FIELDS = { notes: 'summary', detail: 'details' };

// CV and cover letter attachment stubs (ADR-0009). The files they pointed
// at are not coming back, so the stubs go too.
const DROPPED_FIELDS = ['cv', 'coverLetter'];

export function convertApplication(record) {
  const converted = { ...record };

  Object.entries(RENAMED_FIELDS).forEach(([from, to]) => {
    if (!(from in converted)) return;
    // A value already under the new name wins, so converting twice is safe.
    if (!(to in converted)) converted[to] = converted[from];
    delete converted[from];
  });

  DROPPED_FIELDS.forEach((field) => delete converted[field]);
  return converted;
}
