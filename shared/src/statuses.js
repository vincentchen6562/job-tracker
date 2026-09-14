// Every status an application can have, in pipeline order. The order is also
// the order statuses sort in, so a new status goes where it belongs in the
// pipeline, not at the end.
export const STATUS_OPTIONS = [
  'Not started',
  'In progress',
  'Submitted',
  'Interview',
  'Offer',
  'Rejected',
  'Refused',
  'No response',
];
