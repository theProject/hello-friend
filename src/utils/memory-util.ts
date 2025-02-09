// src/utils/memory-util.ts
import { ObjectId } from 'mongodb';
import { clientPromise } from './mongodb'; // Adjust the path if needed

// Extend our memory record interface to include an embedding vector.
export interface MemoryRecord {
  id: string;
  content: string;
  timestamp: Date;
  type: string;
  confirmed: boolean;
  embedding: number[];
  metadata?: {
    type: string;
    created_at: Date;
    fileName?: string;
  };
}

// Define a type for the raw document stored in MongoDB.
interface MemoryDoc {
  _id: ObjectId;
  content: string;
  timestamp: Date;
  type: string;
  confirmed: boolean;
  embedding: number[];
  metadata?: {
    type: string;
    created_at: Date;
    fileName?: string;
  };
}

// Helper function to get the database instance.
async function getDb() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DATABASE_NAME);
  return db;
}

/**
 * Compute an embedding vector for a given text using Azure OpenAI.
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `${process.env.AZURE_OPENAI_EMBEDDING_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}/embeddings?api-version=2023-03-15-preview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY!,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002'
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  const data = await response.json();
  // Assumes the API returns an array with at least one embedding.
  return data.data[0].embedding;
}

/**
 * Store a memory record in the "memories" collection.
 * Computes an embedding for the content and returns the inserted memory (including its generated id).
 */
export async function storeMemory(
  content: string,
  type: string,
  options?: { confirmed?: boolean }
): Promise<MemoryRecord> {
  const db = await getDb();
  const embedding = await getEmbedding(content);
  const memory = {
    content,
    type,
    confirmed: options?.confirmed ?? true,
    timestamp: new Date(),
    embedding,
  };
  const result = await db.collection('memories').insertOne(memory);
  return { id: result.insertedId.toString(), ...memory };
}

/**
 * Update the confirmation status of a memory record.
 */
export async function updateMemoryStatus(
  id: string,
  update: { confirmed: boolean }
): Promise<void> {
  const db = await getDb();
  await db.collection('memories').updateOne(
    { _id: new ObjectId(id) },
    { $set: { confirmed: update.confirmed } }
  );
}

/**
 * Search for memories based on a query string using vector search.
 * For memories of type "message", only confirmed entries are returned.
 */
export async function searchMemories(query: string, limit: number): Promise<MemoryRecord[]> {
  const db = await getDb();
  // Compute the embedding for the query.
  const queryEmbedding = await getEmbedding(query);

  // Use MongoDB Atlas Search's knnBeta operator with explicit generic typing.
  const memories = await db
    .collection<MemoryDoc>('memories')
    .aggregate<MemoryDoc>([
      {
        $search: {
          knnBeta: {
            vector: queryEmbedding,
            path: 'embedding',
            k: limit,
          }
        }
      },
      // Match only documents where either the type is not "message"
      // or, if it is "message", it must be confirmed.
      {
        $match: {
          $or: [
            { type: { $ne: 'message' } },
            { type: 'message', confirmed: true }
          ]
        }
      }
    ])
    .toArray();

  return memories.map((mem: MemoryDoc) => ({
    id: mem._id.toString(),
    content: mem.content,
    timestamp: mem.timestamp,
    type: mem.type,
    confirmed: mem.confirmed,
    embedding: mem.embedding,
    metadata: mem.metadata,
  }));
}

/**
 * Retrieve the most recent confirmed conversation messages.
 */
export async function getRecentConversation(limit: number): Promise<MemoryRecord[]> {
  const db = await getDb();
  const conversations = await db
    .collection<MemoryDoc>('memories')
    .find({ confirmed: true, type: 'message' })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  return conversations.map((conv: MemoryDoc) => ({
    id: conv._id.toString(),
    content: conv.content,
    timestamp: conv.timestamp,
    type: conv.type,
    confirmed: conv.confirmed,
    embedding: conv.embedding,
    metadata: conv.metadata,
  }));
}
