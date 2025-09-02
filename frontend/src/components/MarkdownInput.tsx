import React, { useRef, useState } from 'react';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownPreview } from './MarkdownPreview';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

export const MarkdownInput: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 1000,
  className = ""
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
    
    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertTextAtCursor('  '); // Two spaces for indentation
    }
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.setSelectionRange(start + text.length, start + text.length);
      textarea.focus();
    }, 0);
  };

  const formatText = (before: string, after?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (after) {
      // Wrap selection with before/after (e.g., **text**)
      const newText = before + selectedText + after;
      const newValue = value.substring(0, start) + newText + value.substring(end);
      onChange(newValue);
      
      // Restore selection
      setTimeout(() => {
        if (selectedText) {
          textarea.setSelectionRange(start + before.length, end + before.length);
        } else {
          textarea.setSelectionRange(start + before.length, start + before.length);
        }
        textarea.focus();
      }, 0);
    } else {
      // Insert at cursor (e.g., "> ")
      if (start === 0 || value[start - 1] === '\n') {
        // At start of line, just insert
        insertTextAtCursor(before);
      } else {
        // Not at start of line, add newline first
        insertTextAtCursor('\n' + before);
      }
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className={`${className}`}>
      {/* Preview */}
      <MarkdownPreview 
        text={value} 
        isVisible={showPreview} 
        className="mb-2"
      />

      {/* Toolbar */}
      <MarkdownToolbar
        onFormatText={formatText}
        onInsertText={insertTextAtCursor}
        className="mb-2"
      />

      {/* Input container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="
            w-full px-4 py-3 pr-20
            bg-gray-700 text-white rounded-3xl
            border border-gray-600 focus:border-blue-500 focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none overflow-hidden
            min-h-[48px] max-h-[120px]
            placeholder-gray-400
            font-mono text-sm leading-relaxed
          "
          rows={1}
        />
        
        {/* Character count and preview toggle */}
        <div className="absolute bottom-1 right-16 flex items-center space-x-2">
          {/* Preview toggle */}
          <button
            type="button"
            onClick={togglePreview}
            className={`
              text-xs px-2 py-1 rounded transition-colors
              ${showPreview 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }
            `}
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            👁
          </button>
          
          {/* Character count */}
          {value.length > maxLength * 0.8 && (
            <div className={`text-xs ${
              value.length > maxLength * 0.95 ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {value.length}/{maxLength}
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      {value.length === 0 && (
        <div className="text-xs text-gray-500 mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
          <span>💡 Try: **bold**, *italic*, `code`, &gt; quote</span>
          <span className="hidden sm:inline">⌨️ Shift+Enter for new line</span>
        </div>
      )}
    </div>
  );
};