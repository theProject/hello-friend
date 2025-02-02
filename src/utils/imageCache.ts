// src/utils/imageCache.ts
class ImageCache {
  private cache: Map<string, { blob: Blob; timestamp: number }>;
  private pending: Map<string, Promise<Blob>>;
  private maxAge: number; // Cache duration in milliseconds

  constructor(maxAgeInMinutes: number = 60) {
    this.cache = new Map();
    this.pending = new Map();
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
      timestamp: Date.now(),
    });
  }

  async getOrFetch(url: string): Promise<Blob> {
    // Check the cache first
    const cached = await this.get(url);
    if (cached) return cached;

    // If a fetch for this URL is already in progress, return its promise
    const pendingPromise = this.pending.get(url);
    if (pendingPromise) {
      return pendingPromise;
    }

    // Otherwise, start a new fetch and store its promise in the pending map
    const fetchPromise = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch image from ${url}: ${response.status} ${response.statusText}`
          );
        }
        const blob = await response.blob();
        await this.set(url, blob);
        return blob;
      } finally {
        // Clean up the pending entry regardless of success or failure
        this.pending.delete(url);
      }
    })();

    this.pending.set(url, fetchPromise);
    return fetchPromise;
  }

  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }
}

export const imageCache = new ImageCache();
