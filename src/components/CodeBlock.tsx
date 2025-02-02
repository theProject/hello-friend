// src/components/CodeBlock.tsx
import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/tokyo-night-dark.css'; // code blocks have lots of theme , github has the list for codeblocks

interface CodeBlockProps {
  className?: string;
  children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [children]);

  return (
    <pre className="overflow-x-auto">
      <code ref={codeRef} className={className}>
        {children}
      </code>
    </pre>
  );
};

export default CodeBlock;
