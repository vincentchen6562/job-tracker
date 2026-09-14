import { MongoMemoryReplSet } from 'mongodb-memory-server';

// One in-memory MongoDB for the whole run. It runs as a replica set, not a
// standalone server, because MongoDB only allows transactions on replica sets.
export default async function setup(project) {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  project.provide('mongoUri', replSet.getUri());

  return async () => {
    await replSet.stop();
  };
}
