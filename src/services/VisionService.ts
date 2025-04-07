// src/services/VisionService.ts
export const VisionService = {
    async extractTextFromImage(imageUrl: string): Promise<string> {
      const endpoint = process.env.AZURE_VISION_ENDPOINT!;
      const key = process.env.AZURE_VISION_KEY!;
      const ocrUrl = `${endpoint}/vision/v3.2/ocr?language=en&detectOrientation=true`;
      const res = await fetch(ocrUrl, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      });
      const data = await res.json();
      let text = '';
      for (const region of data.regions || []) {
        for (const line of region.lines) {
          for (const word of line.words) {
            text += word.text + ' ';
          }
          text += '\n';
        }
      }
      return text;
    },
  
    async generateImageTags(imageUrl: string): Promise<string[]> {
      const endpoint = process.env.AZURE_VISION_ENDPOINT!;
      const key = process.env.AZURE_VISION_KEY!;
      const tagUrl = `${endpoint}/vision/v3.2/tag?language=en`;
      const res = await fetch(tagUrl, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      });
      const data = await res.json();
      return data.tags?.map((t: any) => t.name) || [];
    },
  };