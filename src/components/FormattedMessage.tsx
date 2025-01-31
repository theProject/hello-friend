// src/components/FormattedMessage.tsx
import React, { ReactNode } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMessageProps {
  content: string;
  isUser: boolean;
}

interface MarkdownComponentProps {
  children?: ReactNode;
  className?: string;
  ordered?: boolean;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, isUser }) => {
  const components: Partial<Components> = {
    code({ className, children, ...props }: MarkdownComponentProps) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const isInline = !match;

      if (isInline) {
        return (
          <code className="px-1 py-0.5 rounded bg-gray-700 text-gray-100" {...props}>
            {children}
          </code>
        );
      }

      return (
        <div className="my-2">
          <pre className="rounded-lg bg-gray-800 p-4 overflow-x-auto">
            <code className={`language-${language}`}>
              {String(children).replace(/\n$/, '')}
            </code>
          </pre>
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
    li: ({ children, ordered }: MarkdownComponentProps) => {
      const ListWrapper = ordered ? 'ol' : 'ul';
      return (
        <ListWrapper className="list-inside">
          <li className="ml-2">{children}</li>
        </ListWrapper>
      );
    },
    p: ({ children }: MarkdownComponentProps) => (
      <p className="mb-2">{children}</p>
    )
  };

  return (
    <div
      className={`mb-4 p-3 rounded-lg ${
        isUser
          ? 'ml-auto max-w-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          : 'mr-auto max-w-lg bg-gray-200 text-gray-800'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedMessage;