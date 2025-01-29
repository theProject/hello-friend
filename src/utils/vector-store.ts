import clientPromise from './mongodb';

export async function createVectorIndex() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DATABASE_NAME);
  const collection = db.collection(process.env.MONGODB_COLLECTION_NAME!);

  try {
    // Create vector search index
    await collection.createIndex(
      { "embedding": "vector" },
      {
        name: "vector_index",
        definition: {
          "vector": {
            "dimension": 1536, // OpenAI embedding dimension
            "similarity": "cosine"
          }
        }
      }
    );
    console.log('Vector index created successfully');
  } catch (error) {
    console.error('Error creating vector index:', error);
  }
}

// Initialize the vector index when the app starts
createVectorIndex().catch(console.error);