// Applications saved by older versions of the tracker carry fields it no
// longer has. Everything read from storage or a backup passes through here,
// so the applications in memory are always the current shape.

// CV and cover letter attachment stubs (ADR-0009). The files they pointed
// at are not coming back, so the stubs go too.
const DROPPED_FIELDS = ['cv', 'coverLetter'];

export function convertApplication(record) {
  const converted = { ...record };
  DROPPED_FIELDS.forEach((field) => delete converted[field]);
  return converted;
}
