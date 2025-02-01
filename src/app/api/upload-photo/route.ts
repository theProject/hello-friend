// src/app/api/upload-photo/route.ts
import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_BLOB_CONNECTION_STRING!
    );
    
    const containerClient = blobServiceClient.getContainerClient('images');
    await containerClient.createIfNotExists();

    const blobName = `${Date.now()}-${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: file.type
      }
    });

    return NextResponse.json({
      url: blockBlobClient.url,
      name: file.name
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}