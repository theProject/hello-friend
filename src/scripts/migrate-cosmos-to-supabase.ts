// src/scripts/migrate-cosmos-to-supabase.ts
import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

const cosmosClient = new MongoClient(process.env.MONGODB_URI!);
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function migrate() {
  await cosmosClient.connect();
  const cosmosDb = cosmosClient.db('HelloFriend');
  const messages = await cosmosDb.collection('messages').find().toArray();

  for (const msg of messages) {
    await supabase.from('messages').insert({
      conversation_id: msg.conversationId || 'default-conversation-id',
      user_id: msg.userId || 'default-user-id',
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
      tags: msg.tags || [],
      summarized: false,
    });
  }

  await cosmosClient.close();
  console.log('Migration complete');
}

migrate().catch(console.error);