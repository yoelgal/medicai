'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

interface StreamingMarkdownProps {
  content: string;
  isComplete?: boolean;
}

export function StreamingMarkdown({
  content,
  isComplete = false,
}: StreamingMarkdownProps) {
  const processedContent = useMemo(() => {
    if (isComplete) {
      return content;
    }

    // For streaming content, we need to handle incomplete markdown gracefully
    let processedText = content;

    // Handle incomplete code blocks
    const codeBlockMatches = processedText.match(/```[\s\S]*$/);
    if (codeBlockMatches && !processedText.endsWith('```')) {
      // If we have an incomplete code block, add a temporary closing
      processedText += '\n```';
    }

    // Handle incomplete inline code
    const inlineCodeMatches = processedText.match(/`[^`]*$/);
    if (inlineCodeMatches) {
      // If we have incomplete inline code, add a temporary closing
      processedText += '`';
    }

    // Handle incomplete bold/italic
    const boldMatches = processedText.match(/\*\*[^*]*$/);
    if (boldMatches) {
      processedText += '**';
    }

    const italicMatches = processedText.match(/\*[^*]*$/);
    if (italicMatches && !boldMatches) {
      processedText += '*';
    }

    // Handle incomplete headers that might be cut off
    const headerMatches = processedText.match(/^#+\s*$/m);
    if (headerMatches) {
      processedText = processedText.replace(/^#+\s*$/m, '');
    }

    return processedText;
  }, [content, isComplete]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          // Custom components to handle streaming states
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                  {!isComplete && <span className="animate-pulse">|</span>}
                </code>
              );
            }
            return (
              <pre className={className} {...props}>
                <code>
                  {children}
                  {!isComplete && <span className="animate-pulse">|</span>}
                </code>
              </pre>
            );
          },
          p: ({ children, ...props }) => (
            <p {...props}>
              {children}
              {!isComplete &&
                typeof children === 'string' &&
                children.length > 0 && <span className="animate-pulse">|</span>}
            </p>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
      {!isComplete && processedContent.length === 0 && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
}
