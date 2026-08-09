import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.setDefaultResultOrder?.('ipv4first');
} catch (e) {
  // Ignore in environments where setServers is restricted
}

import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.DATABASE_URL) {
  throw new Error('Invalid/Missing environment variable: "DATABASE_URL"');
}

/**
 * Normalizes MongoDB URI to prevent Windows Node.js querySrv ECONNREFUSED errors
 * by resolving Atlas cluster hosts directly when using SRV protocol.
 */
function getNormalizedMongoUri(rawUri: string): string {
  if (rawUri.startsWith('mongodb+srv://') && rawUri.includes('cluster0.coknt7b.mongodb.net')) {
    const match = rawUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)\/?([^?]*)(.*)/);
    if (match) {
      const [, user, pass, , dbName, queryParams] = match;
      const params = new URLSearchParams(queryParams.replace(/^\?/, ''));
      params.set('ssl', 'true');
      params.set('replicaSet', 'atlas-2r0ikk-shard-0');
      params.set('authSource', 'admin');

      const hosts = [
        'ac-6tibmdn-shard-00-00.coknt7b.mongodb.net:27017',
        'ac-6tibmdn-shard-00-01.coknt7b.mongodb.net:27017',
        'ac-6tibmdn-shard-00-02.coknt7b.mongodb.net:27017',
      ].join(',');

      return `mongodb://${user}:${pass}@${hosts}/${dbName || 'boardquest'}?${params.toString()}`;
    }
  }
  return rawUri;
}

const uri = getNormalizedMongoUri(process.env.DATABASE_URL);
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
