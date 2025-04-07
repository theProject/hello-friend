// src/app/api/conversations/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/authOptions';
import { supabaseAdmin } from '../../../lib/supabaseClient';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single()).data?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { userId: requestUserId, title } = await request.json();
  if (requestUserId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .insert({ user_id: userId, title })
    .select()
    .single();

  return NextResponse.json({ conversation });
}