import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Highlight, themes, type Language } from "prism-react-renderer";
import { useTheme } from "../../hooks/useTheme";

interface CodeBlockProps {
  code: string;
  language: string;
}

// prism-react-renderer's bundled grammar list doesn't include every alias we pass
// around the site (e.g. "javascript" needs to map to "jsx" to highlight JSX-flavored
// snippets correctly, and anything unrecognized should still render instead of throwing).
const LANGUAGE_ALIASES: Record<string, Language> = {
  javascript: "jsx",
  js: "jsx",
  typescript: "tsx",
  ts: "tsx",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
};

const resolveLanguage = (language: string): Language =>
  LANGUAGE_ALIASES[language.toLowerCase()] ?? "tsx";

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const prismTheme = theme === "dark" ? themes.vsDark : themes.vsLight;
  const editorBg = theme === "dark" ? "#1e1e1e" : "#ffffff";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden my-6 border border-slate-300 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-[#252526] text-slate-500 dark:text-gray-400 border-b border-slate-300 dark:border-slate-700">
        <span className="text-sm font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded"
          aria-label="Copy code"
        >
          {copied ? (
            <Check size={18} className="text-green-500 dark:text-green-400" />
          ) : (
            <Copy size={18} />
          )}
        </button>
      </div>
      <Highlight code={code.replace(/\n$/, "")} language={resolveLanguage(language)} theme={prismTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} overflow-x-auto p-4 text-sm`}
            style={{ ...style, backgroundColor: editorBg }}
          >
            <code className="font-mono">
              {tokens.map((line, lineIndex) => {
                const lineProps = getLineProps({ line });
                return (
                  <div key={lineIndex} {...lineProps}>
                    <span className="inline-block w-8 select-none text-right pr-3 text-slate-400 dark:text-slate-600">
                      {lineIndex + 1}
                    </span>
                    {line.map((token, tokenIndex) => {
                      const tokenProps = getTokenProps({ token });
                      return <span key={tokenIndex} {...tokenProps} />;
                    })}
                  </div>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
};

export default CodeBlock;
