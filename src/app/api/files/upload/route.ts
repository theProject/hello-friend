// src/app/api/files/upload/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { VisionService } from '../../../../services/VisionService';
import { StorageService } from '../../../../services/StorageService';
import { PineconeService } from '../../../../services/PineconeService';
import { OpenAIService } from '../../../../services/OpenAIService';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (await supabaseAdmin.from('users').select('id, namespace').eq('email', session.user.email).single()).data?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const namespace = (await supabaseAdmin.from('users').select('namespace').eq('id', userId).single()).data?.namespace;
  if (!namespace) {
    return NextResponse.json({ error: 'User namespace not found' }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  const storedPath = `user-${userId}/${Date.now()}-${file.name}`;
  const blobUrl = await StorageService.uploadFile(file, storedPath);

  let extractedText = '';
  let imageTags: string[] = [];
  if (fileExt.match(/(png|jpe?g|gif|pdf)/)) {
    extractedText = await VisionService.extractTextFromImage(blobUrl);
    imageTags = await VisionService.generateImageTags(blobUrl);
  } else if (fileExt === 'txt' || fileExt === 'md') {
    extractedText = await file.text();
  }

  const { data: fileRecord } = await supabaseAdmin
    .from('files')
    .insert({
      user_id: userId,
      filename: file.name,
      url: blobUrl,
      content_text: extractedText.slice(0, 10000),
      tags: imageTags,
    })
    .select()
    .single();

  if (extractedText) {
    const CHUNK_SIZE = 1000;
    const textChunks = extractedText.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || [];
    const embeddings = await Promise.all(
      textChunks.map(async (chunk, i) => {
        const vector = await OpenAIService.generateEmbedding(chunk);
        return {
          id: `file-${fileRecord.id}-chunk-${i}`,
          values: vector,
          metadata: { source: file.name, type: 'file_content', fileId: fileRecord.id },
        };
      })
    );
    await PineconeService.upsert(namespace, embeddings);
  }

  return NextResponse.json({ success: true, fileId: fileRecord.id });
}