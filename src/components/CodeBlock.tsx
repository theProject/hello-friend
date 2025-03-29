// src/components/CodeBlock.tsx
import React, { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import type { Language, PrismTheme } from 'prism-react-renderer';
import { FaRegCopy, FaCheck } from 'react-icons/fa6';

interface CodeBlockProps {
  className?: string;
  children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className = '', children }) => {
  const language = (className.replace(/language-/, '') || 'tsx') as Language;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="relative my-4 bg-gray-900 rounded-xl overflow-hidden shadow-lg text-white">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition"
        >
          {copied ? (
            <>
              <FaCheck className="text-green-400" /> Copied
            </>
          ) : (
            <>
              <FaRegCopy /> Copy
            </>
          )}
        </button>
      </div>
      <Highlight code={children.trim()} language={language} theme={themes.vsDark as PrismTheme}>
        {({
          className,
          style,
          tokens,
          getLineProps,
          getTokenProps,
        }) => (
          <pre className={`${className} p-4 text-sm`} style={style}>
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token });
                    return <span key={key} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export default CodeBlock;
