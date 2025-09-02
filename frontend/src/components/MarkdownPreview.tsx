import React from 'react';
import { parseMarkdown, hasMarkdownFormatting } from '../utils/markdown';

interface Props {
  text: string;
  isVisible: boolean;
  className?: string;
}

export const MarkdownPreview: React.FC<Props> = ({ 
  text, 
  isVisible, 
  className = '' 
}) => {
  if (!isVisible || !text) {
    return null;
  }

  const hasFormatting = hasMarkdownFormatting(text);
  const parsedHtml = parseMarkdown(text);

  return (
    <div className={`${className}`}>
      <div className="
        bg-gray-800 border border-gray-600 rounded-lg p-3 mb-2
        max-h-32 overflow-y-auto scrollbar-hide
      ">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium">
            Preview:
          </span>
          {!hasFormatting && (
            <span className="text-xs text-yellow-400">
              💡 Try using **bold** or *italic*
            </span>
          )}
        </div>
        
        <div className="
          prose prose-invert prose-sm max-w-none
          text-gray-200 leading-relaxed
        ">
          {parsedHtml ? (
            <div 
              dangerouslySetInnerHTML={{ __html: parsedHtml }}
              className="markdown-preview"
            />
          ) : (
            <div className="text-gray-400 italic">
              Type a message to see preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};