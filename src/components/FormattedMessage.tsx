import React, { ReactNode, useEffect, useRef } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import CodeBlock from './CodeBlock';

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
  imageUrl?: string;
  imageAlt?: string;
  onImageClick?: (url: string) => void;
  glassStyle?: string;
  messageStyle?: string;
  isLatestAIMessage?: boolean;
  // Removed isLoading as it's not being used
}

interface MarkdownComponentProps {
  children?: ReactNode;
  className?: string;
  ordered?: boolean;
}

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
  glassStyle = 'bg-white',
  messageStyle = 'bg-white',
  isLatestAIMessage = false,
}) => {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLatestAIMessage && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isLatestAIMessage]);

  const components: Partial<Components> = {
    code({ inline, className = '', children, ...props }: CodeProps) {
      if (inline) {
        return (
          <code className={`px-2 py-1 rounded ${glassStyle} backdrop-blur-md`} {...props}>
            {children}
          </code>
        );
      }

      const languageMatch = /language-(\w+)/.exec(className || '');
      const lang = languageMatch ? languageMatch[1] : 'tsx';

      return (
        <div className="my-2">
          <CodeBlock className={`language-${lang}`}>
            {String(children).replace(/\n$/, '')}
          </CodeBlock>
        </div>
      );
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
    li: ({ children }: MarkdownComponentProps) => <li className="ml-2">{children}</li>,
    p: ({ children }: MarkdownComponentProps) => <div className="mb-2">{children}</div>,
  };

  return (
    <div
      ref={messageRef}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`max-w-xs sm:max-w-md md:max-w-lg p-4 rounded-2xl relative ${
          messageStyle
        } ${isUser && 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'} 
        ${!isUser && 'ai-message-glow'}`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
          className="prose prose-sm max-w-none prose-headings:text-inherit prose-p:text-inherit"
        >
          {content}
        </ReactMarkdown>

        {imageUrl && (
          <div
            className="mt-2 cursor-pointer"
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

        {isUser && (
          <div className="absolute inset-0 rounded-2xl bg-cyan-500 animate-pulse opacity-10 pointer-events-none"></div>
        )}
      </div>
    </div>
  );
};

export default FormattedMessage;