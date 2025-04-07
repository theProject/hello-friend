// src/app/chat/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/authOptions';
import { supabaseAdmin } from '../../lib/supabaseClient';
import ChatUI from '../../components/ChatUI';
import { Message, Conversation } from '../../types';

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    redirect('/auth/signin');
  }

  const userId = (await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single()).data?.id;
  if (!userId) {
    redirect('/auth/signin');
  }

  const { data: conversations } = await supabaseAdmin
    .from('conversations')
    .select('id, title, last_summary')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const conversationId = conversations?.[0]?.id;
  let initialMessages: Message[] = [];
  if (conversationId) {
    const { data } = await supabaseAdmin
      .from('messages')
      .select('role, content, timestamp, type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);
    initialMessages = data || [];
  }

  return (
    <ChatUI userId={userId} conversations={conversations || []} initialMessages={initialMessages} initialConversationId={conversationId} />
  );
}