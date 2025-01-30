// src/utils/memory-util.ts
import clientPromise from './mongodb';

async function getEmbedding(text: string) {
  const response = await fetch(
    `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}/embeddings?api-version=2024-02-15-preview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY!,
      },
      body: JSON.stringify({
        input: text,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Azure OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function storeMemory(content: string, type: string = 'message') {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DATABASE_NAME);
  const collection = db.collection(process.env.MONGODB_COLLECTION_NAME!);

  try {
    // Get vector embedding for the content
    const embedding = await getEmbedding(content);

    // Store the memory with its embedding
    await collection.insertOne({
      type,
      content,
      embedding,
      timestamp: new Date(),
      metadata: {
        type,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error storing memory:', error);
    // Store the memory without embedding if there's an error
    await collection.insertOne({
      type,
      content,
      timestamp: new Date(),
      metadata: {
        type,
        created_at: new Date(),
        error: 'Failed to generate embedding'
      }
    });
  }
}

export async function searchMemories(query: string, limit: number = 5) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DATABASE_NAME);
  const collection = db.collection(process.env.MONGODB_COLLECTION_NAME!);

  try {
    // Get vector embedding for the query
    const queryEmbedding = await getEmbedding(query);

    // Perform vector similarity search
    const memories = await collection.aggregate([
      {
        "$search": {
          "cosmosSearch": {
            "vector": queryEmbedding,
            "path": "embedding",
            "k": limit
          }
        }
      },
      {
        "$project": {
          "content": 1,
          "timestamp": 1,
          "type": 1,
          "metadata": 1,
          "score": { "$meta": "searchScore" }
        }
      }
    ]).toArray();

    return memories;
  } catch (error) {
    console.error('Error searching memories:', error);
    // Fallback to text search if vector search fails
    const memories = await collection
      .find({
        $text: { $search: query }
      })
      .limit(limit)
      .toArray();

    return memories;
  }
}

export async function getRecentConversation(limit: number = 10) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DATABASE_NAME);
  const collection = db.collection(process.env.MONGODB_COLLECTION_NAME!);

  return await collection
    .find({ type: "message" })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}