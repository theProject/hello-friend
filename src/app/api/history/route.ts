// src/app/api/history/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/authOptions';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import { Message } from '../../../types';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (await supabaseAdmin.from('users').select('id').eq('email', session.user.email).single()).data?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const { data: results } = await supabaseAdmin
    .from('messages')
    .select('role, content, timestamp')
    .eq('user_id', userId)
    .or(`content.ilike.%${query}%,tags.contains.{${query.toLowerCase()}}`)
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({ results: results || [] });
}