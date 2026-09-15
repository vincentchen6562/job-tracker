import { rateLimit } from 'express-rate-limit';

const READ_ONLY_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Refuses a data-changing request unless its body is JSON. A page on another
// site can send a form or a text/plain body to the API without the browser
// asking first, but not JSON, so this and SameSite=Lax cookies together stop
// cross-site requests. A request with no body has no content type, so it's
// refused too: the client always sends at least `{}`.
export function requireJson(req, res, next) {
  if (READ_ONLY_METHODS.includes(req.method) || req.is('application/json')) return next();
  res.status(415).json({ error: 'Send the request body as JSON.' });
}

// Allows each IP `limit` requests every `windowMs`, then answers 429. Each call
// keeps its own count, so one limiter used on several routes shares it.
export function createRateLimiter({ limit, windowMs }) {
  return rateLimit({
    limit,
    windowMs,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests. Wait a few minutes and try again.' },
  });
}
