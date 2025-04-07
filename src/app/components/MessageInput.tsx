// src/app/components/MessageInput.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Image, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onGenerateImage: (prompt: string) => void;
  onUploadDocument: (file: File) => void;
  voiceMode: boolean;
  setVoiceMode: (mode: boolean) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onGenerateImage,
  onUploadDocument,
  voiceMode,
  setVoiceMode,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const recognition = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.current.stop();
    } else {
      recognition.current.start();
    }
    setIsListening(!isListening);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      if (input.startsWith('/image ')) {
        const prompt = input.slice(7).trim();
        onGenerateImage(prompt);
      } else {
        onSendMessage(input);
      }
      setInput('');
    }
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePrompt.trim()) {
      onGenerateImage(imagePrompt);
      setImagePrompt('');
      setShowImagePrompt(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadDocument(file);
    }
  };

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-700">
      {showImagePrompt ? (
        <form onSubmit={handleImageSubmit} className="flex space-x-2">
          <input
            type="text"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Enter image prompt..."
            className="flex-1 p-2 bg-gray-800 text-white rounded"
          />
          <button type="submit" className="p-2 bg-vercel-pink text-white rounded">
            Generate
          </button>
          <button
            type="button"
            onClick={() => setShowImagePrompt(false)}
            className="p-2 bg-gray-700 text-white rounded"
          >
            Cancel
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 bg-gray-800 text-white rounded"
            disabled={isLoading}
          />
          <label className="p-2 bg-vercel-pink text-white rounded cursor-pointer">
            <Paperclip size={20} />
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-vercel-pink'} text-white rounded`}
            disabled={isLoading}
          >
            <Mic size={20} />
          </button>
          <button
            type="button"
            onClick={() => setVoiceMode(!voiceMode)}
            className={`p-2 ${voiceMode ? 'bg-vercel-violet' : 'bg-vercel-pink'} text-white rounded`}
            disabled={isLoading}
          >
            {voiceMode ? 'Voice On' : 'Voice Off'}
          </button>
          <button
            type="button"
            onClick={() => setShowImagePrompt(true)}
            className="p-2 bg-vercel-pink text-white rounded"
            disabled={isLoading}
          >
            <Image size={20} />
          </button>
          <button type="submit" className="p-2 bg-vercel-pink text-white rounded" disabled={isLoading}>
            <Send size={20} />
          </button>
        </form>
      )}
    </div>
  );
};

export default MessageInput;