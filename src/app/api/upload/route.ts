import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { storeMemory } from '@/utils/memory-util';
import { parseDocument } from '@/utils/document-parser';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_BLOB_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_BLOB_CONTAINER_NAME!
    );

    const uploadedFiles = [];

    for (const file of files) {
      const blobName = `${Date.now()}-${file.name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      const arrayBuffer = await file.arrayBuffer();
      await blockBlobClient.uploadData(arrayBuffer);

      // Parse document content
      const content = await parseDocument(file);

      
      // Store document reference and content in MongoDB
      await storeMemory(content, 'document');

      uploadedFiles.push({
        name: file.name,
        url: blockBlobClient.url
      });
    }

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}