// src/services/OpenAIService.ts
import { ENV } from '../utils/env';

const AZURE_ENDPOINT = ENV.AZURE_OPENAI_ENDPOINT;
const API_KEY = ENV.AZURE_OPENAI_KEY;

export const OpenAIService = {
  async generateChatCompletion(messages: { role: string; content: string }[], { model, stream }: { model: string; stream: boolean }) {
    const deployment = model === 'gpt-4o-realtime-preview' ? ENV.AZURE_OPENAI_GPT4_AUDIO_DEPLOYMENT : ENV.AZURE_OPENAI_GPT4_DEPLOYMENT;
    const url = `${AZURE_ENDPOINT}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        stream,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate chat completion');
    }

    if (!stream) {
      const data = await response.json();
      return { text: data.choices[0].message.content };
    }

    return response.body?.getReader();
  },

  async generateEmbedding(text: string): Promise<number[]> {
    const deploy = ENV.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT;
    const url = `${AZURE_ENDPOINT}/openai/deployments/${deploy}/embeddings?api-version=2024-02-01`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text }),
    });
    const data = await res.json();
    return data.data[0].embedding;
  },

  async generateImage(prompt: string): Promise<string> {
    const deploy = ENV.AZURE_OPENAI_DALLE_DEPLOYMENT;
    const url = `${AZURE_ENDPOINT}/openai/deployments/${deploy}/images/generations?api-version=2024-02-01`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: '1792x1024',
        quality: 'hd',
        style: 'vivid',
      }),
    });
    const data = await res.json();
    return data.data[0].url;
  },
};