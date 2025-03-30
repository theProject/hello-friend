import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import type { Message } from '@/types';

function isImagePrompt(prompt: string): boolean {
  const lowered = prompt.toLowerCase();
  const visualHints = [
    'image',
    'photo',
    'picture',
    'visual',
    'art',
    'drawing',
    'sketch',
    'illustration',
    'painting',
  ];
  const commandHints = [
    'draw',
    'visualize',
    'show me',
    'create an image',
    'generate an image',
    'make a picture',
  ];
  return (
    visualHints.some((v) => lowered.includes(v)) ||
    commandHints.some((v) => lowered.includes(v))
  );
}

function isPolicyBlocked(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.includes('content_policy_violation')
  );
}

function createMessage(content: string, role: 'user' | 'assistant', overrides?: Partial<Message>): Message {
  return {
    id: crypto.randomUUID(),
    content,
    role,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

async function sendPrompt(
  prompt: string,
  speechSynthesizer: sdk.SpeechSynthesizer | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsLoading: (loading: boolean) => void,
  setIsGeneratingImage: (loading: boolean) => void
) {
  const userMessage = createMessage(prompt, 'user');
  setMessages((prev) => [...prev, userMessage]);
  setIsLoading(true);

  try {
    if (isImagePrompt(prompt)) {
      setIsGeneratingImage(true);
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (!res.ok || !data.imageUrl) {
        throw new Error('Image generation failed.');
      }

      const imgMessage = createMessage(`Generated image for: "${prompt}"`, 'assistant', {
        imageUrl: data.imageUrl,
        imageAlt: prompt,
      });

      setMessages((prev) => [...prev, imgMessage]);

      if (speechSynthesizer) {
        speechSynthesizer.speakTextAsync("Here's the image you asked for.");
      }
    } else {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();

      if (!res.ok || !data.response) {
        throw new Error('Chat response failed.');
      }

      const assistantMessage = createMessage(data.response, 'assistant');
      setMessages((prev) => [...prev, assistantMessage]);

      if (speechSynthesizer) {
        speechSynthesizer.speakTextAsync(data.response);
      }
    }
  } catch (err) {
    const fallback = isPolicyBlocked(err)
      ? "I'm sorry, but that request was blocked by safety filters."
      : "Something went wrong. Please try again.";

    const errorMessage = createMessage(fallback, 'assistant');
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
    setIsGeneratingImage(false);
  }
}

export {
  isImagePrompt,
  isPolicyBlocked,
  createMessage,
  sendPrompt
};
