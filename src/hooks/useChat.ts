// src/hooks/useChat.ts
'use client';

import { useState, useCallback } from 'react';
import { Message } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = useCallback(async (content: string, interrupt = false) => {
    if (content.startsWith('/history ')) {
      const query = content.slice(9).trim();
      const searchMessage: Message = { role: 'assistant', content: `Looking up history for "${query}"...`, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, searchMessage]);

      const response = await fetch(`/api/history?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      const resultsMessage: Message = {
        role: 'assistant',
        type: 'history',
        content: data.results.length > 0
          ? `Found ${data.results.length} past messages, studs:\n${data.results.map((msg: Message) => `- ${msg.timestamp}: ${msg.content}`).join('\n')}`
          : `No past messages found for "${query}", bruh.`,
        timestamp: new Date().toISOString(),
        tags: ['history', query],
      };
      setMessages((prev) => [...prev, resultsMessage]);
    }
  }, []);

  return { messages, setMessages, sendMessage };
};