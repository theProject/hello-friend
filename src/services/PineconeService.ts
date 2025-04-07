// src/services/PineconeService.ts
import { Pinecone } from '@pinecone-database/pinecone';

const pineconeClient = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const PineconeService = {
  async query(namespace: string, embedding: number[], topK: number) {
    const index = pineconeClient.Index(process.env.PINECONE_INDEX!);
    const queryResponse = await index.query({
      namespace,
      topK,
      vector: embedding,
      includeMetadata: true,
      includeValues: false,
    });
    return queryResponse.matches || [];
  },

  async upsert(namespace: string, vectors: { id: string; values: number[]; metadata?: object }[]) {
    const index = pineconeClient.Index(process.env.PINECONE_INDEX!);
    await index.upsert({ namespace, vectors });
  },

  async initNamespace(namespace: string) {
    return true;
  },
};