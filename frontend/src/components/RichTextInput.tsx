import React, { useRef, useState, useCallback, useEffect } from 'react';
import { TextSelectionPopup } from './TextSelectionPopup';
import { RichTextToolbar } from './RichTextToolbar';
import { parseMarkdown, hasMarkdownFormatting, formatText } from '../utils/markdown';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  showToolbar?: boolean;
  autoFocus?: boolean;
}

interface Selection {
  text: string;
  start: number;
  end: number;
}

export const RichTextInput: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 2000,
  className = "",
  showToolbar = true,
  autoFocus = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showWysiwyg, setShowWysiwyg] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, []);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || isComposing) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end && end - start > 0) {
      const selectedText = value.substring(start, end);
      if (selectedText.trim()) {
        setSelection({
          text: selectedText,
          start,
          end
        });
      }
    } else {
      setSelection(null);
    }
  }, [value, isComposing]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustTextareaHeight();
    
    // Auto-detect markdown and show WYSIWYG
    const hasFormatting = hasMarkdownFormatting(e.target.value);
    setShowWysiwyg(hasFormatting && e.target.value.trim().length > 0);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;

    // Submit on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
      return;
    }

    // Handle formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      let format = '';
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          format = 'bold';
          break;
        case 'i':
          e.preventDefault();
          format = 'italic';
          break;
        case 'u':
          e.preventDefault();
          format = 'underline';
          break;
        case '`':
          e.preventDefault();
          format = 'code';
          break;
        case 'k':
          e.preventDefault();
          // Create link - special handling
          insertLinkDialog();
          return;
      }
      
      if (format) {
        formatAtCursor(format);
      }
    }

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertTextAtCursor('  '); // Two spaces for indentation
    }
  };

  // Insert text at cursor position
  const insertTextAtCursor = useCallback((text: string) => {
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
  }, [value, onChange]);

  // Format selected text
  const formatSelection = useCallback((type: string) => {
    if (!selection || !textareaRef.current) return;

    const { start, end } = selection;
    const selectedText = value.substring(start, end);
    
    const formattedText = formatText(selectedText, type);
    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
    
    // Restore focus and selection
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        const newEnd = start + formattedText.length;
        textarea.setSelectionRange(newEnd, newEnd);
      }
    }, 0);
    
    setSelection(null);
  }, [selection, value, onChange]);

  // Format at cursor position (for toolbar buttons)
  const formatAtCursor = useCallback((type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      // Text is selected, format it
      const selectedText = value.substring(start, end);
      const formattedText = formatText(selectedText, type);
      
      const newValue = value.substring(0, start) + formattedText + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);
      }, 0);
    } else {
      // No selection, insert formatting markers
      const formats: Record<string, { prefix: string; suffix: string; offset?: number }> = {
        bold: { prefix: '**', suffix: '**' },
        italic: { prefix: '*', suffix: '*' },
        underline: { prefix: '__', suffix: '__' },
        strikethrough: { prefix: '~~', suffix: '~~' },
        code: { prefix: '`', suffix: '`' },
        spoiler: { prefix: '||', suffix: '||' },
        highlight: { prefix: '==', suffix: '==' },
        h1: { prefix: '# ', suffix: '', offset: 0 },
        h2: { prefix: '## ', suffix: '', offset: 0 },
        h3: { prefix: '### ', suffix: '', offset: 0 },
        quote: { prefix: '> ', suffix: '', offset: 0 },
      };
      
      const format = formats[type];
      if (format) {
        const insertText = format.prefix + format.suffix;
        const newValue = value.substring(0, start) + insertText + value.substring(end);
        onChange(newValue);
        
        // Position cursor appropriately
        setTimeout(() => {
          textarea.focus();
          const cursorPos = start + format.prefix.length + (format.offset || 0);
          textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
      }
    }
  }, [value, onChange]);

  // Insert link dialog
  const insertLinkDialog = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      const linkText = selectedText || 'link text';
      const linkMarkdown = `[${linkText}](${url})`;
      const newValue = value.substring(0, start) + linkMarkdown + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        const newPos = start + linkMarkdown.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  }, [value, onChange]);

  // Handle toolbar formatting
  const handleToolbarFormat = useCallback((type: string) => {
    if (type === 'keyboard') {
      const key = prompt('Enter keyboard key:', 'Ctrl+C');
      if (key) {
        insertTextAtCursor(`[[${key}]]`);
      }
    } else {
      formatAtCursor(type);
    }
  }, [formatAtCursor, insertTextAtCursor]);

  // Handle toolbar text insertion
  const handleToolbarInsert = useCallback((text: string) => {
    insertTextAtCursor(text);
  }, [insertTextAtCursor]);

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [autoFocus, disabled]);

  // Adjust height on value change
  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  return (
    <div className={`${className}`}>
      {/* WYSIWYG Preview */}
      {showWysiwyg && value && (
        <div className="mb-3 p-4 bg-gray-800 border border-gray-600 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-400 font-medium">Live Preview</div>
            <button
              onClick={() => setShowWysiwyg(false)}
              className="text-xs text-gray-500 hover:text-gray-300"
              title="Hide preview"
            >
              ✕
            </button>
          </div>
          <div 
            ref={previewRef}
            className="text-sm text-white markdown-content prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
          />
        </div>
      )}

      {/* Rich Text Toolbar */}
      {showToolbar && (
        <RichTextToolbar
          onFormat={handleToolbarFormat}
          onInsertText={handleToolbarInsert}
          className="mb-3"
        />
      )}

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
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="
            w-full px-4 py-3 pr-20
            bg-gray-700 text-white rounded-2xl
            border border-gray-600 focus:border-blue-500 focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none overflow-hidden
            min-h-[52px] max-h-[200px]
            placeholder-gray-400
            text-sm leading-relaxed
            touch-manipulation
            font-sans
          "
          rows={1}
          spellCheck="true"
          autoComplete="off"
        />
        
        {/* Character count and preview toggle */}
        <div className="absolute bottom-2 right-16 flex items-center space-x-2">
          {/* Preview toggle (when there's formatting) */}
          {hasMarkdownFormatting(value) && !showWysiwyg && (
            <button
              type="button"
              onClick={() => setShowWysiwyg(true)}
              className="
                text-xs px-2 py-1 rounded bg-gray-600 text-gray-300 
                hover:bg-gray-500 transition-colors
              "
              title="Show preview"
            >
              👁
            </button>
          )}
          
          {/* Character count */}
          {value.length > maxLength * 0.7 && (
            <div className="text-xs">
              <span className={
                value.length > maxLength * 0.95 ? 'text-red-400' : 
                value.length > maxLength * 0.85 ? 'text-yellow-400' : 'text-gray-400'
              }>
                {value.length}/{maxLength}
              </span>
            </div>
          )}
        </div>
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
        <div className="text-xs text-gray-500 mt-2 space-y-1">
          <div className="flex items-center space-x-4">
            <span>✨ Rich text formatting enabled</span>
            <span className="hidden sm:inline">⌨️ Try Ctrl+B, Ctrl+I, Ctrl+U</span>
          </div>
          <div className="hidden sm:block">
            <span>**bold** • *italic* • `code` • ||spoiler|| • ==highlight==</span>
          </div>
        </div>
      )}
    </div>
  );
};