import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TextSelectionPopup } from './TextSelectionPopup';
import { SimpleMarkdownToolbar } from './SimpleMarkdownToolbar';
import { parseMarkdown, hasMarkdownFormatting } from '../utils/markdown';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

interface Selection {
  text: string;
  start: number;
  end: number;
}

export const WhatsAppStyleInput: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 1000,
  className = ""
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showWysiwyg, setShowWysiwyg] = useState(false);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, []);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const selectedText = value.substring(start, end);
      setSelection({
        text: selectedText,
        start,
        end
      });
    } else {
      setSelection(null);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustTextareaHeight();
    
    // Auto-detect markdown and show WYSIWYG
    const hasFormatting = hasMarkdownFormatting(e.target.value);
    setShowWysiwyg(hasFormatting);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Format selected text
  const formatSelection = useCallback((type: 'bold' | 'italic' | 'code') => {
    if (!selection || !textareaRef.current) return;

    const { start, end } = selection;
    const selectedText = value.substring(start, end);
    
    let formattedText = '';
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
    }

    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
    
    // Restore focus and selection
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
      }
    }, 0);
    
    setSelection(null);
  }, [selection, value, onChange]);

  // Format at cursor position (for toolbar buttons)
  const formatAtCursor = useCallback((type: 'bold' | 'italic' | 'code') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      // Text is selected, format it
      const selectedText = value.substring(start, end);
      let formattedText = '';
      
      switch (type) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        case 'code':
          formattedText = `\`${selectedText}\``;
          break;
      }
      
      const newValue = value.substring(0, start) + formattedText + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);
      }, 0);
    } else {
      // No selection, insert formatting markers
      let markers = '';
      switch (type) {
        case 'bold':
          markers = '****';
          break;
        case 'italic':
          markers = '**';
          break;
        case 'code':
          markers = '``';
          break;
      }
      
      const newValue = value.substring(0, start) + markers + value.substring(end);
      onChange(newValue);
      
      // Position cursor between markers
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + markers.length / 2, start + markers.length / 2);
      }, 0);
    }
  }, [value, onChange]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  return (
    <div className={`${className}`}>
      {/* WYSIWYG Preview */}
      {showWysiwyg && value && (
        <div className="mb-2 p-3 bg-gray-800 border border-gray-600 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">Preview:</div>
          <div 
            ref={previewRef}
            className="text-sm text-white markdown-content prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
          />
        </div>
      )}

      {/* Simplified Toolbar */}
      <SimpleMarkdownToolbar
        onFormat={formatAtCursor}
        className="mb-2"
      />

      {/* Input container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
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
            text-sm leading-relaxed
            touch-manipulation
          "
          rows={1}
        />
        
        {/* Character count */}
        {value.length > maxLength * 0.8 && (
          <div className="absolute bottom-2 right-16 text-xs">
            <span className={
              value.length > maxLength * 0.95 ? 'text-red-400' : 'text-yellow-400'
            }>
              {value.length}/{maxLength}
            </span>
          </div>
        )}
      </div>

      {/* Text Selection Popup */}
      <TextSelectionPopup
        selection={selection}
        onFormat={formatSelection}
        onClose={() => setSelection(null)}
        containerRef={textareaRef}
      />

      {/* Quick tips */}
      {value.length === 0 && (
        <div className="text-xs text-gray-500 mt-2">
          <span className="hidden sm:inline">💡 Select text to format it instantly • </span>
          <span>**bold** • *italic* • `code`</span>
        </div>
      )}
    </div>
  );
};