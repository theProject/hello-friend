// src/utils/env.ts
function requireEnv(key: string): string {
    const val = process.env[key];
    if (!val) throw new Error(`Missing env var: ${key}`);
    return val;
  }
  
  export const ENV = {
    NEXTAUTH_SECRET: requireEnv('NEXTAUTH_SECRET'),
    SUPABASE_URL: requireEnv('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    PINECONE_API_KEY: requireEnv('PINECONE_API_KEY'),
    PINECONE_INDEX: requireEnv('PINECONE_INDEX'),
    AZURE_OPENAI_ENDPOINT: requireEnv('AZURE_OPENAI_ENDPOINT'),
    AZURE_OPENAI_KEY: requireEnv('AZURE_OPENAI_KEY'),
    AZURE_OPENAI_GPT4_DEPLOYMENT: requireEnv('AZURE_OPENAI_GPT4_DEPLOYMENT'),
    AZURE_OPENAI_GPT4_AUDIO_DEPLOYMENT: requireEnv('AZURE_OPENAI_GPT4_AUDIO_DEPLOYMENT'),
    AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT: requireEnv('AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT'),
    AZURE_OPENAI_DALLE_DEPLOYMENT: requireEnv('AZURE_OPENAI_DALLE_DEPLOYMENT'),
    AZURE_STORAGE_ACCOUNT: requireEnv('AZURE_STORAGE_ACCOUNT'),
    AZURE_STORAGE_KEY: requireEnv('AZURE_STORAGE_KEY'),
    AZURE_STORAGE_CONTAINER: requireEnv('AZURE_STORAGE_CONTAINER'),
    AZURE_VISION_KEY: requireEnv('AZURE_VISION_KEY'),
    AZURE_VISION_ENDPOINT: requireEnv('AZURE_VISION_ENDPOINT'),
    BING_SEARCH_KEY: requireEnv('BING_SEARCH_KEY'),
    GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  };