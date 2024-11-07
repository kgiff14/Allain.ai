import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { AlertCircle, Copy, Check } from 'lucide-react';

interface MarkdownProps {
  content: string;
}

// Helper component for copy button
interface CopyButtonProps {
  text: string;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-2 text-zinc-400 hover:text-zinc-200 transition-colors ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
};

const EnhancedMarkdown: React.FC<MarkdownProps> = ({ content }) => {
  if (!content) return null;

  const ensureCompleteCodeBlocks = (text: string) => {
    const lines = text.split('\n');
    let backtickCount = 0;

    for (const line of lines) {
      if (line.includes('```')) {
        backtickCount++;
      }
    }

    return backtickCount % 2 !== 0 ? text + '\n```' : text;
  };

  const processedContent = ensureCompleteCodeBlocks(content);

  return (
    <div className="prose prose-invert max-w-none relative group">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            try {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';

              if (!inline && language) {
                const codeContent = String(children).replace(/\n$/, '');
                
                return (
                  <div className="relative rounded-md overflow-hidden group/code">
                    <div className="absolute top-0 right-0 px-2 py-1 text-xs text-zinc-400 bg-zinc-800/80 rounded-bl flex items-center gap-2">
                      <span>{language}</span>
                      <CopyButton text={codeContent} />
                    </div>
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus as any}
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.375rem',
                        paddingTop: '2rem',
                      }}
                      {...props}
                    >
                      {codeContent}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              return (
                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            } catch (error) {
              console.warn('Error rendering code block:', error);
              return <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm">{children}</code>;
            }
          },
          p({ children }: { children: React.ReactNode }) {
            return <p className="text-zinc-300 mb-4 leading-7">{children}</p>;
          },
          ul({ children }: { children: React.ReactNode }) {
            return <ul className="list-disc pl-6 mb-4 text-zinc-300">{children}</ul>;
          },
          ol({ children }: { children: React.ReactNode }) {
            return <ol className="list-decimal pl-6 mb-4 text-zinc-300">{children}</ol>;
          },
          li({ children }: { children: React.ReactNode }) {
            return <li className="mb-1">{children}</li>;
          },
          blockquote({ children }: { children: React.ReactNode }) {
            return (
              <blockquote className="border-l-4 border-zinc-700 pl-4 italic my-4 text-zinc-400">
                {children}
              </blockquote>
            );
          },
          h1({ children }: { children: React.ReactNode }) {
            return <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>;
          },
          h2({ children }: { children: React.ReactNode }) {
            return <h2 className="text-xl font-bold text-white mb-3">{children}</h2>;
          },
          h3({ children }: { children: React.ReactNode }) {
            return <h3 className="text-lg font-bold text-white mb-2">{children}</h3>;
          },
          table({ children }: { children: React.ReactNode }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-700">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }: { children: React.ReactNode }) {
            return (
              <th className="px-4 py-2 bg-zinc-800 text-left text-zinc-300">
                {children}
              </th>
            );
          },
          td({ children }: { children: React.ReactNode }) {
            return (
              <td className="px-4 py-2 border-t border-zinc-700 text-zinc-300">
                {children}
              </td>
            );
          }
        }}
      >
        {processedContent}
        </ReactMarkdown>
        {/* Copy entire message button */}
        <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Copy message</span>
            <CopyButton 
                text={content} 
                className="bg-zinc-800/80 rounded-md hover:bg-zinc-700/80"
            />
        </div>
      </div>
    </div>
  );
};

// Error boundary specific for markdown rendering
class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-400 p-4 rounded-lg bg-red-900/20 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>Failed to render markdown content</span>
        </div>
      );
    }

    return this.props.children;
  }
}

const SafeMarkdown: React.FC<MarkdownProps> = ({ content }) => {
  return (
    <MarkdownErrorBoundary>
      <EnhancedMarkdown content={content} />
    </MarkdownErrorBoundary>
  );
};

export default SafeMarkdown;