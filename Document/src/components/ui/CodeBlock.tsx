import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Highlight, themes, type Language } from "prism-react-renderer";
import { useTypewriterReveal } from "../../hooks/useTypewriterReveal";

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
  const normalizedCode = code.replace(/\n$/, "");

  // Plays a one-time-per-snippet typewriter reveal the first time this block
  // scrolls into view (and again if the code prop later switches to a
  // different snippet, e.g. a tab/example switcher reusing this instance).
  // Renders fully revealed on the server and on first client paint (so
  // SSR/no-JS/SEO always see complete code with no hydration mismatch), then
  // animates client-side. See useTypewriterReveal for details.
  const { ref: typewriterRef, revealedCount } = useTypewriterReveal<HTMLDivElement>(
    normalizedCode,
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={typewriterRef}
      className="relative group rounded-lg overflow-hidden my-6 border border-slate-700 shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] text-gray-400 border-b border-slate-700">
        <span className="text-sm font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded"
          aria-label="Copy code"
        >
          {copied ? (
            <Check size={18} className="text-green-400" />
          ) : (
            <Copy size={18} />
          )}
        </button>
      </div>
      <Highlight code={normalizedCode} language={resolveLanguage(language)} theme={themes.vsDark}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => {
          // Distributes the reveal budget across tokens in document order so
          // every visible character stays inside its correctly-colored token
          // span throughout the animation (no plain-text/re-parse flicker).
          let remainingReveal = revealedCount;

          return (
            <pre
              className={`${className} overflow-x-auto p-4 text-sm`}
              style={{ ...style, backgroundColor: "#1e1e1e" }}
            >
              <code className="font-mono">
                {tokens.map((line, lineIndex) => {
                  const lineProps = getLineProps({ line });
                  return (
                    <div key={lineIndex} {...lineProps}>
                      <span className="inline-block w-8 select-none text-right pr-3 text-slate-600">
                        {lineIndex + 1}
                      </span>
                      {line.map((token, tokenIndex) => {
                        const tokenProps = getTokenProps({ token });
                        const visibleLength = Math.max(
                          0,
                          Math.min(token.content.length, remainingReveal),
                        );
                        remainingReveal -= visibleLength;
                        return (
                          <span key={tokenIndex} {...tokenProps}>
                            {token.content.slice(0, visibleLength)}
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </code>
            </pre>
          );
        }}
      </Highlight>
    </div>
  );
};

export default CodeBlock;
