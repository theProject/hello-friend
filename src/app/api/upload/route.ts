import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { storeMemory } from '@/utils/memory-util';

// Need to disable the default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_BLOB_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_BLOB_CONTAINER_NAME!
    );

    const uploadedFiles = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      const blobName = `${Date.now()}-${file.name}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Azure Blob Storage
      await blockBlobClient.uploadData(buffer);

      let content = '';
      // Handle different file types
      if (file.type === 'application/pdf') {
        // For PDFs, we'll need to parse them - for now just store the name
        content = `PDF File uploaded: ${file.name}`;
      } else if (file.type === 'text/plain') {
        // For text files, we can get the content directly
        content = await file.text();
      } else {
        content = `File uploaded: ${file.name}`;
      }

      // Store file reference in memory
      await storeMemory(content, 'document');

      uploadedFiles.push({
        name: file.name,
        url: blockBlobClient.url,
        type: file.type,
        size: file.size
      });
    }

    return NextResponse.json({ 
      files: uploadedFiles,
      message: 'Files uploaded successfully' 
    });

  } catch (error) {
    console.error('Error in upload endpoint:', error);
    return NextResponse.json(
      { error: 'Error uploading files' },
      { status: 500 }
    );
  }
}