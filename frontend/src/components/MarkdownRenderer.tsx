import React, { useEffect, useRef } from 'react';
import { parseMarkdown, hasMarkdownFormatting } from '../utils/markdown';

interface Props {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ 
  content, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle spoiler clicks
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleSpoilerClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('spoiler') || target.hasAttribute('data-spoiler')) {
        target.classList.toggle('revealed');
      }
    };

    container.addEventListener('click', handleSpoilerClick);
    return () => {
      container.removeEventListener('click', handleSpoilerClick);
    };
  }, [content]);

  if (!content) {
    return null;
  }

  // Check if content has markdown formatting
  const hasFormatting = hasMarkdownFormatting(content);
  
  if (!hasFormatting) {
    // Render as plain text with basic styling
    return (
      <div className={`select-text break-words ${className}`}>
        {content}
      </div>
    );
  }

  // Parse and render as markdown
  const parsedHtml = parseMarkdown(content);

  return (
    <div 
      ref={containerRef}
      className={`
        select-text break-words markdown-content
        prose prose-invert prose-sm max-w-none
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
};