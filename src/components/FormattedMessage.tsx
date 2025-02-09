import React, { ReactNode } from 'react';
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
  glassStyle?: string; // New prop for glass base style
  messageStyle?: string; // New prop for message-specific style
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
}) => {
  const components: Partial<Components> = {
    // Render code blocks using our CodeBlock component with glass styling
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
      className={`mb-4 p-4 backdrop-blur-lg rounded-2xl transform transition-all duration-300
        ${isUser ? 'ml-auto' : 'mr-auto'} max-w-[80%] 
        ${isUser 
          ? `${messageStyle} rounded-tr-none hover:-translate-y-1 hover:-rotate-1` 
          : `${messageStyle} rounded-tl-none hover:-translate-y-1 hover:rotate-1`}
        ${isUser
          ? 'bg-opacity-40 border border-white/20' 
          : 'bg-opacity-30 border border-white/10'}
        animate-fade-scale`}
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
  );
};

export default FormattedMessage;