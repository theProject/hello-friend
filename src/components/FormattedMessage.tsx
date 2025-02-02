// src/components/FormattedMessage.tsx
import React, { ReactNode } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import CodeBlock from './CodeBlock'; // Custom code block using highlight.js

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
  imageUrl?: string;
  imageAlt?: string;
  onImageClick?: (url: string) => void;
}

interface MarkdownComponentProps {
  children?: ReactNode;
  className?: string;
  ordered?: boolean;
}

// Extend the props for the code component to include "inline"
interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({
  content,
  isUser,
  imageUrl,
  imageAlt,
  onImageClick,
}) => {
  const components: Partial<Components> = {
    // Render code blocks using our CodeBlock component
    code({ inline, className, children, ...props }: CodeProps) {
      if (inline) {
        return (
          <code className="px-2 py-2 rounded bg-gray-700 text-gray-100" {...props}>
            {children}
          </code>
        );
      } else {
        return (
          <div className="my-2">
            <CodeBlock className={className}>
              {String(children).replace(/\n$/, '')}
            </CodeBlock>
          </div>
        );
      }
    },
    h1: ({ children }: MarkdownComponentProps) => (
      <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>
    ),
    h2: ({ children }: MarkdownComponentProps) => (
      <h2 className="text-lg font-semibold mb-2 mt-3">{children}</h2>
    ),
    h3: ({ children }: MarkdownComponentProps) => (
      <h3 className="text-base font-medium mb-1 mt-2">{children}</h3>
    ),
    ol: ({ children }: MarkdownComponentProps) => (
      <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
    ),
    ul: ({ children }: MarkdownComponentProps) => (
      <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
    ),
    li: ({ children, ordered }: MarkdownComponentProps) => {
      const ListWrapper = ordered ? 'ol' : 'ul';
      return (
        <ListWrapper className="list-inside">
          <li className="ml-2">{children}</li>
        </ListWrapper>
      );
    },
    // Replace paragraphs with a <div> to prevent block elements from nesting inside <p>
    p: ({ children }: MarkdownComponentProps) => (
      <div className="mb-2">{children}</div>
    ),
  };

  return (
    <div
      className={`mb-4 p-3 rounded-lg ${
        isUser
          ? 'ml-auto max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          : 'mr-auto max-w-lg bg-gray-200 text-gray-800'
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
      {imageUrl && (
        <div
          className="relative mt-2 w-full h-64 rounded cursor-pointer"
          onClick={() => onImageClick && onImageClick(imageUrl)}
        >
          <Image
            src={imageUrl}
            alt={imageAlt || 'Image'}
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default FormattedMessage;
