// src/services/StorageService.ts
import { BlobServiceClient } from '@azure/storage-blob';

const blobServiceClient = BlobServiceClient.fromConnectionString(
  `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT};AccountKey=${process.env.AZURE_STORAGE_KEY}`
);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER!);

export const StorageService = {
  async uploadFile(file: File, path: string): Promise<string> {
    const blobClient = containerClient.getBlockBlobClient(path);
    const buffer = Buffer.from(await file.arrayBuffer());
    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: file.type },
    });
    return blobClient.url;
  },

  async uploadBuffer(buffer: Buffer, options: { contentType: string }): Promise<string> {
    const path = `media-${Date.now()}.${options.contentType.split('/')[1]}`;
    const blobClient = containerClient.getBlockBlobClient(path);
    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: options.contentType },
    });
    return blobClient.url;
  },
};