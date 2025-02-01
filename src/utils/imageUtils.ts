// src/utils/imageUtils.ts
import { imageCache } from './imageCache';

// Add FileSystemHandle types
interface FileSystemWritableFileStream extends WritableStream {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface ShowSaveFilePicker {
  (options?: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }): Promise<FileSystemFileHandle>;
}

export async function downloadImage(url: string, filename?: string): Promise<void> {
  try {
    const blob = await imageCache.getOrFetch(url);
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || `image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

export async function saveToDevice(blob: Blob, filename: string): Promise<void> {
  if ('showSaveFilePicker' in window) {
    try {
      const showSaveFilePicker = (window as unknown as { showSaveFilePicker: ShowSaveFilePicker }).showSaveFilePicker;
      const handle = await showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Image File',
          accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
          }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // Fall back to traditional download if user didn't just cancel
        await downloadImage(URL.createObjectURL(blob), filename);
      }
    }
  } else {
    // Fall back to traditional download for unsupported browsers
    await downloadImage(URL.createObjectURL(blob), filename);
  }
}

export function createImageThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}