import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden my-6">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-400">
        <span className="text-sm font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded"
          aria-label="Copy code"
        >
          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 bg-gray-900 text-white text-sm">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;