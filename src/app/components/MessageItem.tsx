// src/app/components/MessageItem.tsx
import React from 'react';
import { Message } from '../../types';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const isImage = message.content.includes('[Image generated:');

  return (
    <div
      className={`mb-2 p-2 rounded-lg max-w-md ${
        isAssistant ? 'bg-gray-800 text-white mr-auto animate-pulse' : 'bg-gray-200 text-gray-800 ml-auto'
      } ${isAssistant && !message.type ? 'text-vercel-pink animate-shimmer' : ''}`}
    >
      {message.type === 'search' || message.type === 'history' ? (
        <div>
          {message.content.split('\n').map((line, i) => (
            <p key={i} className="text-white">{line}</p>
          ))}
        </div>
      ) : isImage ? (
        <img src={message.content.match(/\[Image generated: (.*?)\]/)?.[1]} alt="Generated" className="max-w-full rounded" />
      ) : (
        message.content
      )}
    </div>
  );
};

export default MessageItem;