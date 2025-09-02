import React, { useRef, useState, useCallback, useEffect } from 'react';
import { parseMarkdown, hasMarkdownFormatting, formatText } from '../utils/markdown';

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

interface FloatingToolbarProps {
  selection: Selection;
  onFormat: (type: string) => void;
  onClose: () => void;
  containerRef: React.RefObject<HTMLTextAreaElement>;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  selection,
  onFormat,
  onClose,
  containerRef
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!selection || !containerRef.current) return;

    const updatePosition = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const windowSelection = window.getSelection();
      
      if (!windowSelection || windowSelection.rangeCount === 0) return;

      const range = windowSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position toolbar above selection
      const x = rect.left + (rect.width / 2) - 120; // 240px toolbar width / 2
      const y = rect.top - 50;
      
      // Keep within viewport
      const adjustedX = Math.max(10, Math.min(x, window.innerWidth - 250));
      const adjustedY = Math.max(10, y);
      
      setPosition({ x: adjustedX, y: adjustedY });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [selection, containerRef]);

  const quickFormats = [
    { id: 'bold', icon: '𝐁', label: 'Bold', shortcut: '**' },
    { id: 'italic', icon: '𝐼', label: 'Italic', shortcut: '*' },
    { id: 'code', icon: '</>', label: 'Code', shortcut: '`' },
    { id: 'spoiler', icon: '👁', label: 'Spoiler', shortcut: '||' }
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl p-1 flex items-center space-x-1"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        {quickFormats.map((format) => (
          <button
            key={format.id}
            onClick={() => onFormat(format.id)}
            className="
              group flex items-center justify-center
              w-9 h-9 rounded-lg text-sm font-bold
              bg-gray-700 hover:bg-blue-500 text-gray-300 hover:text-white
              transition-all duration-200 touch-manipulation
            "
            title={`${format.label} (${format.shortcut})`}
          >
            {format.icon}
          </button>
        ))}
        
        <div className="w-px h-6 bg-gray-600 mx-1" />
        
        <button
          onClick={() => onFormat('link')}
          className="
            flex items-center justify-center
            w-9 h-9 rounded-lg text-sm font-bold
            bg-gray-700 hover:bg-green-500 text-gray-300 hover:text-white
            transition-all duration-200 touch-manipulation
          "
          title="Add link"
        >
          🔗
        </button>
      </div>
    </>
  );
};

interface InlineToolbarProps {
  onFormat: (type: string) => void;
  onTogglePreview: () => void;
  showPreview: boolean;
  hasFormatting: boolean;
}

const InlineToolbar: React.FC<InlineToolbarProps> = ({
  onFormat,
  onTogglePreview,
  showPreview,
  hasFormatting
}) => {
  const [showMore, setShowMore] = useState(false);

  const primaryFormats = [
    { id: 'bold', icon: '𝐁', label: 'Bold' },
    { id: 'italic', icon: '𝐼', label: 'Italic' },
    { id: 'code', icon: '</>', label: 'Code' }
  ];

  const secondaryFormats = [
    { id: 'quote', icon: '"', label: 'Quote' },
    { id: 'bulletlist', icon: '•', label: 'List' },
    { id: 'spoiler', icon: '👁', label: 'Spoiler' },
    { id: 'highlight', icon: '🖍', label: 'Highlight' }
  ];

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-1">
        {/* Primary formats - always visible */}
        {primaryFormats.map((format) => (
          <button
            key={format.id}
            onClick={() => onFormat(format.id)}
            className="
              flex items-center justify-center
              w-8 h-8 rounded-lg text-sm font-medium
              bg-gray-700/50 hover:bg-gray-600 text-gray-400 hover:text-white
              transition-all duration-200 touch-manipulation
            "
            title={format.label}
          >
            {format.icon}
          </button>
        ))}

        {/* More button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`
            flex items-center justify-center
            w-8 h-8 rounded-lg text-xs font-medium
            transition-all duration-200 touch-manipulation
            ${showMore 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-700/50 hover:bg-gray-600 text-gray-400 hover:text-white'
            }
          `}
          title="More formatting options"
        >
          +
        </button>

        {/* Secondary formats - show when expanded */}
        {showMore && (
          <div className="flex items-center space-x-1 ml-2">
            {secondaryFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => onFormat(format.id)}
                className="
                  flex items-center justify-center
                  w-8 h-8 rounded-lg text-sm font-medium
                  bg-gray-700/50 hover:bg-gray-600 text-gray-400 hover:text-white
                  transition-all duration-200 touch-manipulation
                "
                title={format.label}
              >
                {format.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-1">
        {hasFormatting && (
          <button
            onClick={onTogglePreview}
            className={`
              text-xs px-2 py-1 rounded-md transition-all duration-200
              ${showPreview 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600 hover:text-white'
              }
            `}
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            👁
          </button>
        )}
        
        <div className="text-xs text-gray-500">
          Select text to format
        </div>
      </div>
    </div>
  );
};

export const ModernRichTextInput: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 2000,
  className = ""
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [hasFormatting, setHasFormatting] = useState(false);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
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
      if (selectedText.trim().length > 0) {
        setSelection({ text: selectedText, start, end });
        return;
      }
    }
    
    setSelection(null);
  }, [value, isComposing]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    adjustTextareaHeight();
    
    // Check for formatting
    const hasMarkdown = hasMarkdownFormatting(newValue);
    setHasFormatting(hasMarkdown);
    
    // Auto-show preview for complex formatting
    if (hasMarkdown && newValue.length > 50) {
      setShowPreview(true);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
      return;
    }

    // Format shortcuts
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
        case '`':
          e.preventDefault();
          format = 'code';
          break;
      }
      
      if (format) {
        formatAtCursor(format);
      }
    }
  };

  // Insert text at cursor
  const insertTextAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    
    onChange(newValue);
    
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
    
    if (type === 'link') {
      const url = prompt('Enter URL:', 'https://');
      if (url) {
        const linkText = `[${selectedText}](${url})`;
        const newValue = value.substring(0, start) + linkText + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textareaRef.current?.focus();
          textareaRef.current?.setSelectionRange(start + linkText.length, start + linkText.length);
        }, 0);
      }
    } else {
      const formattedText = formatText(selectedText, type);
      const newValue = value.substring(0, start) + formattedText + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
        }
      }, 0);
    }
    
    setSelection(null);
  }, [selection, value, onChange]);

  // Format at cursor
  const formatAtCursor = useCallback((type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      formatSelection(type);
      return;
    }

    // Insert formatting markers
    const formats: Record<string, { prefix: string; suffix: string }> = {
      bold: { prefix: '**', suffix: '**' },
      italic: { prefix: '*', suffix: '*' },
      code: { prefix: '`', suffix: '`' },
      spoiler: { prefix: '||', suffix: '||' },
      highlight: { prefix: '==', suffix: '==' },
      quote: { prefix: '> ', suffix: '' },
      bulletlist: { prefix: '- ', suffix: '' }
    };
    
    const format = formats[type];
    if (format) {
      const insertText = format.prefix + format.suffix;
      const newValue = value.substring(0, start) + insertText + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        const cursorPos = start + format.prefix.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    }
  }, [value, onChange, formatSelection]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded-2xl p-3 ${className}`}>
      {/* Live Preview */}
      {showPreview && hasFormatting && (
        <div className="mb-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Preview</span>
            <button
              onClick={() => setShowPreview(false)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
          <div 
            className="text-sm text-white markdown-content prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
          />
        </div>
      )}

      {/* Inline Toolbar */}
      <InlineToolbar
        onFormat={formatAtCursor}
        onTogglePreview={() => setShowPreview(!showPreview)}
        showPreview={showPreview}
        hasFormatting={hasFormatting}
      />

      {/* Text Input */}
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
            w-full px-0 py-2
            bg-transparent text-white border-none outline-none resize-none
            placeholder-gray-400 text-sm leading-relaxed
            min-h-[48px] max-h-[150px] overflow-y-auto
          "
          rows={1}
          spellCheck="true"
        />
        
        {/* Character count */}
        {value.length > maxLength * 0.8 && (
          <div className="absolute bottom-2 right-0 text-xs">
            <span className={
              value.length > maxLength * 0.95 ? 'text-red-400' : 
              value.length > maxLength * 0.9 ? 'text-yellow-400' : 'text-gray-500'
            }>
              {value.length}/{maxLength}
            </span>
          </div>
        )}
      </div>

      {/* Floating toolbar for selected text */}
      {selection && (
        <FloatingToolbar
          selection={selection}
          onFormat={formatSelection}
          onClose={() => setSelection(null)}
          containerRef={textareaRef}
        />
      )}

      {/* Helper text */}
      {value.length === 0 && (
        <div className="text-xs text-gray-500 mt-2 space-y-1">
          <div>💡 **bold** • *italic* • `code` • ||spoiler||</div>
          <div className="text-gray-600">Select text for quick formatting • Ctrl+B/I for shortcuts</div>
        </div>
      )}
    </div>
  );
};