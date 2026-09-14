import mongoose from 'mongoose';

// Opens a dedicated Mongoose connection rather than using Mongoose's global
// one, so the app works with whichever connection it is handed and each test
// file can bring its own database.
export async function connectDatabase(uri, options = {}) {
  return mongoose.createConnection(uri, options).asPromise();
}
