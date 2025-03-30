import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import type { Message } from '@/types';

/** The shape of the object returned by sendPrompt */
interface PromptResult {
  blocked: boolean;
  message: Message;
}

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

function createMessage(content: string, role: 'user' | 'assistant'): Message {
  return {
    id: crypto.randomUUID(),
    content,
    role,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Let's define a custom type guard for an AbortError.
 * It's recognized if it's a DOMException named 'AbortError'.
 */
function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export async function sendPrompt(
  prompt: string,
  speechSynthesizer?: sdk.SpeechSynthesizer | null,
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsLoading?: (loading: boolean) => void,
  setIsGeneratingImage?: (loading: boolean) => void,
  signal?: AbortSignal
): Promise<PromptResult> {
  let blocked = false;
  let finalMessage: Message = createMessage('Something went wrong.', 'assistant');

  try {
    if (setIsLoading) setIsLoading(true);

    if (isImagePrompt(prompt)) {
      if (setIsGeneratingImage) setIsGeneratingImage(true);

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal,
      });
      const data = await res.json();

      if (!res.ok || !data.imageUrl) {
        throw new Error('Image generation failed.');
      }

      finalMessage = createMessage(`Generated image for: "${prompt}"`, 'assistant');
      finalMessage.imageUrl = data.imageUrl;
      finalMessage.imageAlt = prompt;

      if (speechSynthesizer) {
        speechSynthesizer.speakTextAsync("Here's the image you asked for.");
      }
    } else {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
        signal,
      });
      const data = await res.json();

      if (!res.ok || !data.response) {
        throw new Error('Chat response failed.');
      }

      finalMessage = createMessage(data.response, 'assistant');

      if (speechSynthesizer) {
        speechSynthesizer.speakTextAsync(data.response);
      }
    }
  } catch (err) {
    if (isPolicyBlocked(err)) {
      blocked = true;
      finalMessage = createMessage(
        "I'm sorry, but that request was blocked by safety filters.",
        'assistant'
      );
    } else if (isAbortError(err)) {
      blocked = true;
      finalMessage = createMessage('Request was aborted by the user.', 'assistant');
    } else {
      blocked = true;
      finalMessage = createMessage('Something went wrong. Please try again.', 'assistant');
    }
  } finally {
    if (setIsLoading) setIsLoading(false);
    if (setIsGeneratingImage) setIsGeneratingImage(false);
  }

  return {
    blocked,
    message: finalMessage,
  };
}
