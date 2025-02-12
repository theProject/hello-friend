import React, { ReactNode, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import CodeBlock from './CodeBlock';

// Define all component props types
interface FormattedMessageProps {
  content: string;      // Message content
  isUser: boolean;      // Determines if message is from user or AI
  imageUrl?: string;    // Optional image URL
  imageAlt?: string;    // Optional image alt text
  onImageClick?: (url: string) => void;  // Image click handler
  glassStyle?: string;  // Glass effect class
  messageStyle?: string; // Message style class
}

// Markdown component props
interface MarkdownComponentProps {
  children?: ReactNode;
  className?: string;
  ordered?: boolean;
}

// Code block props
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
  glassStyle = 'glass-base-light',
  messageStyle = 'glass-message-light',
}) => {
  // Generate random delay class for border animation
  const randomDelay = useMemo(() => {
    const delays = [
      'ai-message-border-delay-0',
      'ai-message-border-delay-1',
      'ai-message-border-delay-2',
      'ai-message-border-delay-3',
      'ai-message-border-delay-4'
    ];
    return delays[Math.floor(Math.random() * delays.length)];
  }, []);

  // Check for Safari/iOS
  const isSafari = useMemo(() => {
    if (typeof window !== 'undefined') {
      return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }
    return false;
  }, []);

  // Configure markdown components
  const components: Partial<Components> = {
    // Handle code blocks with syntax highlighting
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
      }
      return (
        <div className="my-2">
          <CodeBlock className={`${glassStyle} backdrop-blur-md ${className}`}>
            {String(children).replace(/\n$/, '')}
          </CodeBlock>
        </div>
      );
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
    p: ({ children }: MarkdownComponentProps) => (
      <div className="mb-2">{children}</div>
    ),
  };

  return (
    <div
      className={`mb-4 backdrop-blur-lg rounded-2xl transform transition-all duration-300
        ${isUser ? 'ml-auto' : 'mr-auto'} max-w-[80%] 
        ${isUser 
          ? `${messageStyle} rounded-tr-none hover:-translate-y-1 hover:-rotate-1` 
          : `${messageStyle} rounded-tl-none hover:-translate-y-1 hover:rotate-1 
             ${!isSafari ? `ai-message-border ${randomDelay}` : 'ai-message-border-fallback'}`}
        animate-fade-scale`}
    >
      <div className="p-4">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          components={components}
          className="prose prose-sm max-w-none prose-headings:text-inherit prose-p:text-inherit"
        >
          {content}
        </ReactMarkdown>
        
        {/* Image display with glass effect */}
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