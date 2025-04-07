// src/services/SearchService.ts
export const SearchService = {
    async searchWeb(query: string): Promise<Array<{ title: string; snippet: string; url: string }>> {
      const apiKey = process.env.BING_SEARCH_KEY!;
      const endpoint = `https://api.bing.microsoft.com/v7.0/search`;
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`, {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
      });
      const data = await res.json();
      return data.webPages?.value.slice(0, 3).map((item: any) => ({
        title: item.name,
        snippet: item.snippet,
        url: item.url,
      })) || [];
    },
  };