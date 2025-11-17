import { MongoClient, type Db, type Collection, GridFSBucket } from "mongodb";
import { type RecordingDocument } from "./types";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn(
    "MONGODB_URI is not set. API routes depending on MongoDB will throw until it is configured."
  );
}

const dbName = process.env.MONGODB_DB ?? "saarthi";

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let clientPromise: Promise<MongoClient> | undefined;

if (uri) {
  const globalWithMongo = globalThis as GlobalWithMongo;

  if (process.env.NODE_ENV === "development") {
    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

const getDb = async (): Promise<Db> => {
  if (!clientPromise) {
    throw new Error(
      "MongoDB client not initialised. Ensure MONGODB_URI is set."
    );
  }
  const client = await clientPromise;
  return client.db(dbName);
};

export const getRecordingsCollection = async (): Promise<
  Collection<RecordingDocument>
> => {
  const db = await getDb();
  return db.collection<RecordingDocument>("recordings");
};

let bucket: GridFSBucket | null = null;

export const getRecordingsBucket = async () => {
  if (!clientPromise) {
    throw new Error(
      "MongoDB client not initialised. Ensure MONGODB_URI is set."
    );
  }
  if (bucket) return bucket;
  const client = await clientPromise;
  bucket = new GridFSBucket(client.db(dbName), {
    bucketName: "audioChunks",
    chunkSizeBytes: 256 * 1024,
  });
  return bucket;
};
