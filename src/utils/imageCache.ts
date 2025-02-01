// src/utils/imageCache.ts
class ImageCache {
    private cache: Map<string, { blob: Blob; timestamp: number }>;
    private maxAge: number; // Cache duration in milliseconds
  
    constructor(maxAgeInMinutes: number = 60) {
      this.cache = new Map();
      this.maxAge = maxAgeInMinutes * 60 * 1000;
    }
  
    async get(url: string): Promise<Blob | null> {
      const cached = this.cache.get(url);
      if (cached) {
        if (Date.now() - cached.timestamp < this.maxAge) {
          return cached.blob;
        } else {
          this.cache.delete(url);
        }
      }
      return null;
    }
  
    async set(url: string, blob: Blob): Promise<void> {
      this.cache.set(url, {
        blob,
        timestamp: Date.now()
      });
    }
  
    async getOrFetch(url: string): Promise<Blob> {
      const cached = await this.get(url);
      if (cached) return cached;
  
      const response = await fetch(url);
      const blob = await response.blob();
      await this.set(url, blob);
      return blob;
    }
  
    clear(): void {
      this.cache.clear();
    }
  }
  
  export const imageCache = new ImageCache();