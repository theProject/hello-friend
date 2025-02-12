import React, { ReactNode } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import CodeBlock from './CodeBlock';

// Type definitions for component props
interface FormattedMessageProps {
  content: string;      // The message content to display
  isUser: boolean;      // Whether this is a user message (true) or AI message (false)
  imageUrl?: string;    // Optional URL for attached images
  imageAlt?: string;    // Optional alt text for images
  onImageClick?: (url: string) => void;  // Optional image click handler
  glassStyle?: string;  // Glass effect style class
  messageStyle?: string; // Message-specific style class
}

// Types for markdown component props
interface MarkdownComponentProps {
  children?: ReactNode;
  className?: string;
  ordered?: boolean;
}

// Types for code block props
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
  glassStyle = 'glass-base-light',  // Default light mode glass style
  messageStyle = 'glass-message-light', // Default light mode message style
}) => {
  // Custom components for markdown rendering
  const components: Partial<Components> = {
    // Handle code blocks and inline code
    code({ inline, className, children, ...props }: CodeProps) {
      if (inline) {
        return (
          <code 
            className={`px-2 py-1 rounded ${glassStyle} backdrop-blur-md`} 
            {...props}
          >
            {children}
          </code>
        );
      } else {
        return (
          <div className="my-2">
            <CodeBlock className={`${glassStyle} backdrop-blur-md ${className}`}>
              {String(children).replace(/\n$/, '')}
            </CodeBlock>
          </div>
        );
      }
    },
    // Heading styles
    h1: ({ children }: MarkdownComponentProps) => (
      <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>
    ),
    h2: ({ children }: MarkdownComponentProps) => (
      <h2 className="text-lg font-semibold mb-2 mt-3">{children}</h2>
    ),
    h3: ({ children }: MarkdownComponentProps) => (
      <h3 className="text-base font-medium mb-1 mt-2">{children}</h3>
    ),
    // List styles
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
    // Paragraph wrapper
    p: ({ children }: MarkdownComponentProps) => (
      <div className="mb-2">{children}</div>
    ),
  };

  return (
    <div
      className={`mb-4 backdrop-blur-lg rounded-2xl transform transition-all duration-300
        ${isUser ? 'ml-auto' : 'mr-auto'} max-w-[80%] 
        ${isUser 
          // User message styling
          ? `${messageStyle} rounded-tr-none hover:-translate-y-1 hover:-rotate-1` 
          // AI message styling with animated border
          : `${messageStyle} rounded-tl-none hover:-translate-y-1 hover:rotate-1 ai-message-border`}
        animate-fade-scale`}
    >
      {/* Content wrapper with padding */}
      <div className="p-4">
        {/* Markdown content renderer */}
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          components={components}
          className="prose prose-sm max-w-none prose-headings:text-inherit prose-p:text-inherit"
        >
          {content}
        </ReactMarkdown>
        
        {/* Optional image display */}
        {imageUrl && (
          <div
            className={`relative mt-4 w-full overflow-hidden rounded-xl cursor-pointer
              ${glassStyle} p-2 transform transition-all duration-300 hover:scale-[1.02]`}
            onClick={() => onImageClick && onImageClick(imageUrl)}
          >
            <div className="relative w-full h-64">
              <Image
                src={imageUrl}
                alt={imageAlt || 'Image'}
                fill
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormattedMessage;