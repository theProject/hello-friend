// src/utils/vector-store.ts
import { clientPromise } from './mongodb';

async function createVectorIndex() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DATABASE_NAME);

  try {
    // Create vector search index using MongoDB Atlas command
    await db.command({
      createSearchIndexes: process.env.MONGODB_COLLECTION_NAME,
      indexes: [
        {
          name: "vectorSearchIndex",
          definition: {
            mappings: {
              dynamic: true,
              fields: {
                embedding: {
                  dimensions: 1536,
                  similarity: "cosine",
                  type: "knnVector"
                }
              }
            }
          }
        }
      ]
    });
    
    console.log('Vector index created successfully');
  } catch (error) {
    console.error('Error creating vector index:', error);
  }
}

// Initialize the vector index when the app starts
createVectorIndex().catch(console.error);