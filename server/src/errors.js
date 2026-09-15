import mongoose from 'mongoose';

// The field a Mongoose validation or cast error is about.
function invalidField(error) {
  if (error instanceof mongoose.Error.CastError) return error.path;
  return Object.keys(error.errors)[0];
}

// The last middleware: turns an error thrown by a route into a JSON answer
// the browser can show. An invalid value is the request's fault (400);
// anything else is the server's (500), and gets logged.
export function handleErrors(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (
    error instanceof mongoose.Error.ValidationError ||
    error instanceof mongoose.Error.CastError
  ) {
    return res.status(400).json({ error: `Invalid value for ${invalidField(error)}.` });
  }

  // Errors from the JSON body parser, such as a body that isn't valid JSON,
  // carry their own 4xx status.
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: error.expose ? error.message : 'Bad request.' });
  }

  console.error(error);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}
