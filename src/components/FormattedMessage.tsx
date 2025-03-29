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
  isLoading?: boolean;
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
  glassStyle = 'glass-base-light',
  messageStyle = 'glass-message-light',
  isLatestAIMessage = false,
  isLoading = false,
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
      className={`mb-4 backdrop-blur-lg rounded-2xl transform transition-all duration-300
      ${isUser ? 'ml-auto' : 'mr-auto'} max-w-[80%] 
      ${isUser
        ? `${messageStyle} rounded-tr-none hover:-translate-y-1 hover:-rotate-1`
        : `${messageStyle} rounded-tl-none hover:-translate-y-1 hover:rotate-1`
      }
      ${!isUser && isLatestAIMessage && !isLoading ? 'glow-border' : ''}
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
