// src/app/components/ChatSidebar.tsx
'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Conversation } from '../../types';

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}) => {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 p-4">
      <button
        onClick={onNewConversation}
        className="flex items-center w-full px-4 py-2 mb-4 bg-vercel-pink text-white rounded hover:bg-vercel-violet transition"
      >
        <Plus size={20} className="mr-2" />
        New Chat
      </button>
      <div className="space-y-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`w-full text-left px-4 py-2 rounded ${
              conv.id === currentConversationId ? 'bg-gray-800 text-vercel-pink' : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            {conv.title || 'Untitled Chat'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSidebar;