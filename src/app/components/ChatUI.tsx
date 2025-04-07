// src/app/components/ChatUI.tsx
'use client';

import React, { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Message, Conversation } from '../../types';

interface ChatUIProps {
  userId: string;
  conversations: Conversation[];
  initialMessages: Message[];
  initialConversationId: string | null;
}

const ChatUI: React.FC<ChatUIProps> = ({ userId, conversations: initialConversations, initialMessages, initialConversationId }) => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  useEffect(() => {
    if (!currentConversationId && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations]);

  useEffect(() => {
    if (currentConversationId) {
      const fetchMessages = async () => {
        const response = await fetch(`/api/messages?conversationId=${currentConversationId}`);
        const data = await response.json();
        setMessages(data.messages || []);
      };
      fetchMessages();
    }
  }, [currentConversationId]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentConversationId) return;
    setIsLoading(true);

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      tags: extractTags(content),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/handle-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          conversationId: currentConversationId,
          message: content,
          voice: voiceMode,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream');

      let partialAssistantMsg = '';
      const assistantMessage: Message = { role: 'assistant', content: '', timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        partialAssistantMsg += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: partialAssistantMsg };
          return updated;
        });
      }

      const data = JSON.parse(partialAssistantMsg);
      if (voiceMode && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: `Error: ${errorMessage}` };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    const imageMessage: Message = { role: 'user', content: `/image ${prompt}`, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, imageMessage]);
    sendMessage(`/image ${prompt}`);
  };

  const handleUploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Uploaded document: ${file.name}. I can answer questions about it now!`, timestamp: new Date().toISOString() },
        ]);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Failed to upload document, bruh: ${errorMessage}`, timestamp: new Date().toISOString() },
      ]);
    }
  };

  const createNewConversation = async () => {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title: 'New Chat' }),
    });
    const data = await response.json();
    setConversations((prev) => [...prev, data.conversation]);
    setCurrentConversationId(data.conversation.id);
    setMessages([]);
  };

  const extractTags = (content: string): string[] => {
    const tags: string[] = [];
    const words = content.toLowerCase().split(/\s+/);
    if (words.includes('john')) tags.push('john');
    if (words.includes('dog')) tags.push('dog');
    return tags;
  };

  return (
    <div className="flex h-screen">
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewConversation={createNewConversation}
      />
      <div className="flex-1 flex flex-col">
        <MessageList messages={messages} />
        <MessageInput
          onSendMessage={sendMessage}
          onGenerateImage={handleGenerateImage}
          onUploadDocument={handleUploadDocument}
          voiceMode={voiceMode}
          setVoiceMode={setVoiceMode}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatUI;