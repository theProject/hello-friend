// src/app/api/handle-prompt/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/authOptions';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import { ChatService } from '../../../services/ChatService';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single()).data?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { conversationId, message, voice } = await request.json();
  if (!conversationId || !message) {
    return NextResponse.json({ error: 'Missing conversationId or message' }, { status: 400 });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  ChatService.handlePromptStream(userId, conversationId, message, { voiceMode: voice }, writer, encoder);

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}