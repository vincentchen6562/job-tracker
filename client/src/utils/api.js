// A thin wrapper around fetch for the tracker's own API, which lives on the
// same origin as the page (ADR-0004), so the session cookie goes with every
// request.

import { ACCOUNT_HEADER } from '@job-tracker/shared';

const KIND_BY_STATUS = {
  400: 'validation',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  429: 'rate-limited',
};

export class ApiError extends Error {
  name = 'ApiError';

  // `status` is 0 when the server couldn't be reached at all.
  constructor(status, message) {
    super(message);
    this.status = status;
    this.kind = status === 0 ? 'network' : (KIND_BY_STATUS[status] ?? 'unexpected');
  }
}

// Resolves with the response's JSON (null when it has none), or rejects with
// an ApiError carrying the server's message. Given `accountId`, the server
// answers 401 if the session has since become another account's.
export async function api(method, path, body, { accountId } = {}) {
  // The server refuses a data-changing request that isn't JSON, so one is
  // always sent, even when there's nothing to say.
  const sendsBody = method !== 'GET';
  const headers = {};
  if (sendsBody) headers['Content-Type'] = 'application/json';
  if (accountId) headers[ACCOUNT_HEADER] = accountId;

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers,
      body: sendsBody ? JSON.stringify(body ?? {}) : undefined,
    });
  } catch {
    throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? `Something went wrong (${response.status}).`);
  }
  return data;
}
