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

interface Suggestion {
  id: string;
  text: string;
  description: string;
  icon: string;
  trigger: string;
  replacement: string;
}

const FORMATTING_SUGGESTIONS: Suggestion[] = [
  {
    id: 'bold',
    text: '**bold**',
    description: 'Make text bold',
    icon: '𝐁',
    trigger: '**',
    replacement: '**text**'
  },
  {
    id: 'italic',
    text: '*italic*',
    description: 'Make text italic',
    icon: '𝐼',
    trigger: '*',
    replacement: '*text*'
  },
  {
    id: 'code',
    text: '`code`',
    description: 'Inline code',
    icon: '</>',
    trigger: '`',
    replacement: '`code`'
  },
  {
    id: 'codeblock',
    text: '```code block```',
    description: 'Multi-line code',
    icon: '{ }',
    trigger: '```',
    replacement: '```\ncode\n```'
  },
  {
    id: 'quote',
    text: '> quote',
    description: 'Block quote',
    icon: '"',
    trigger: '>',
    replacement: '> quote text'
  },
  {
    id: 'list',
    text: '- list item',
    description: 'Bullet list',
    icon: '•',
    trigger: '-',
    replacement: '- list item'
  },
  {
    id: 'spoiler',
    text: '||spoiler||',
    description: 'Hidden spoiler text',
    icon: '👁',
    trigger: '||',
    replacement: '||spoiler||'
  },
  {
    id: 'highlight',
    text: '==highlight==',
    description: 'Highlighted text',
    icon: '🖍',
    trigger: '==',
    replacement: '==highlighted=='
  }
];

interface SuggestionsDropdownProps {
  suggestions: Suggestion[];
  selectedIndex: number;
  onSelect: (suggestion: Suggestion) => void;
  position: { x: number; y: number };
}

const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  position
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div
      className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 min-w-64"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-xs text-gray-400 mb-2 px-2">Formatting suggestions:</div>
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          className={`
            w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left
            transition-colors duration-150
            ${index === selectedIndex 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-300 hover:bg-gray-700'
            }
          `}
        >
          <span className="text-lg">{suggestion.icon}</span>
          <div className="flex-1">
            <div className="text-sm font-medium">
              <code className="text-xs bg-gray-700 px-1 rounded">
                {suggestion.text}
              </code>
            </div>
            <div className="text-xs opacity-75">
              {suggestion.description}
            </div>
          </div>
        </button>
      ))}
      <div className="border-t border-gray-700 mt-2 pt-2">
        <div className="text-xs text-gray-500 px-2">
          ↑↓ Navigate • Enter to select • Esc to cancel
        </div>
      </div>
    </div>
  );
};

interface QuickActionsBarProps {
  onFormat: (type: string) => void;
  onShowHelp: () => void;
  hasSelection: boolean;
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onFormat,
  onShowHelp,
  hasSelection
}) => {
  const quickActions = [
    { id: 'bold', icon: '𝐁', label: 'Bold' },
    { id: 'italic', icon: '𝐼', label: 'Italic' },
    { id: 'code', icon: '</>', label: 'Code' }
  ];

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700 mb-2">
      <div className="flex items-center space-x-1">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onFormat(action.id)}
            className="
              flex items-center justify-center w-7 h-7 rounded-md text-xs
              bg-gray-700/50 hover:bg-gray-600 text-gray-400 hover:text-white
              transition-all duration-200 touch-manipulation
            "
            title={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="text-xs text-gray-500">
          {hasSelection ? '✨ Select text to format' : '💡 Type ** for bold, * for italic'}
        </div>
        <button
          onClick={onShowHelp}
          className="
            text-xs text-gray-500 hover:text-gray-300 transition-colors
            w-5 h-5 rounded-full bg-gray-700/50 hover:bg-gray-600
            flex items-center justify-center
          "
          title="Formatting help"
        >
          ?
        </button>
      </div>
    </div>
  );
};

export const SmartRichTextInput: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 2000,
  className = ""
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
    setHasSelection(start !== end && end - start > 0);
  }, []);

  // Get cursor position for suggestions
  const getCursorPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { x: 0, y: 0 };

    const textareaRect = textarea.getBoundingClientRect();
    return {
      x: textareaRect.left + 20,
      y: textareaRect.bottom + 5
    };
  }, []);

  // Handle input change with smart suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    adjustTextareaHeight();
    
    // Auto-show preview for complex content
    const hasFormatting = hasMarkdownFormatting(newValue);
    setShowPreview(hasFormatting && newValue.length > 30);
    
    // Check for trigger characters at cursor position
    const beforeCursor = newValue.substring(0, cursorPos);
    const lastChars = beforeCursor.slice(-2);
    const lastChar = beforeCursor.slice(-1);
    
    // Find matching suggestions
    const matchingSuggestions = FORMATTING_SUGGESTIONS.filter(suggestion => 
      suggestion.trigger === lastChar || suggestion.trigger === lastChars
    );
    
    if (matchingSuggestions.length > 0) {
      setSuggestions(matchingSuggestions);
      setSelectedSuggestionIndex(0);
      setShowSuggestions(true);
      setSuggestionPosition(getCursorPosition());
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle suggestions navigation
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      
      if (e.key === 'Enter') {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestionIndex]);
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Handle normal shortcuts
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

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: Suggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const triggerLength = suggestion.trigger.length;
    
    // Remove trigger and insert replacement
    const beforeTrigger = value.substring(0, cursorPos - triggerLength);
    const afterCursor = value.substring(cursorPos);
    const newValue = beforeTrigger + suggestion.replacement + afterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Position cursor appropriately
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = beforeTrigger.length + suggestion.replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  // Format at cursor
  const formatAtCursor = useCallback((type: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      // Format selected text
      const selectedText = value.substring(start, end);
      const formattedText = formatText(selectedText, type);
      const newValue = value.substring(0, start) + formattedText + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);
      }, 0);
    } else {
      // Insert formatting markers
      const formats: Record<string, { prefix: string; suffix: string }> = {
        bold: { prefix: '**', suffix: '**' },
        italic: { prefix: '*', suffix: '*' },
        code: { prefix: '`', suffix: '`' }
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
    }
  }, [value, onChange]);

  // Click outside to hide suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-suggestions]')) {
        setShowSuggestions(false);
        setShowHelp(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  return (
    <div className={`relative ${className}`} data-suggestions>
      <div className="bg-gray-800 border border-gray-600 rounded-2xl p-3 focus-within:border-blue-500 transition-colors">
        {/* Quick Actions Bar */}
        <QuickActionsBar
          onFormat={formatAtCursor}
          onShowHelp={() => setShowHelp(!showHelp)}
          hasSelection={hasSelection}
        />

        {/* Live Preview */}
        {showPreview && (
          <div className="mb-3 p-3 bg-gray-900/30 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Live Preview</span>
              <button
                onClick={() => setShowPreview(false)}
                className="text-xs text-gray-500 hover:text-gray-300"
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

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSelect={handleTextSelection}
          onMouseUp={handleTextSelection}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="
            w-full bg-transparent text-white border-none outline-none resize-none
            placeholder-gray-400 text-sm leading-relaxed
            min-h-[44px] max-h-[120px] overflow-y-auto
          "
          rows={1}
          spellCheck="true"
        />
        
        {/* Character count */}
        {value.length > maxLength * 0.8 && (
          <div className="text-xs text-right mt-1">
            <span className={
              value.length > maxLength * 0.95 ? 'text-red-400' : 
              value.length > maxLength * 0.9 ? 'text-yellow-400' : 'text-gray-500'
            }>
              {value.length}/{maxLength}
            </span>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <SuggestionsDropdown
          suggestions={suggestions}
          selectedIndex={selectedSuggestionIndex}
          onSelect={applySuggestion}
          position={suggestionPosition}
        />
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">Quick Formatting Guide</h4>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-blue-300 font-medium mb-1">Basic</div>
              <div className="space-y-1 text-xs text-gray-300">
                <div><code>**bold**</code> → <strong>bold</strong></div>
                <div><code>*italic*</code> → <em>italic</em></div>
                <div><code>`code`</code> → <code className="bg-gray-700 px-1 rounded">code</code></div>
              </div>
            </div>
            <div>
              <div className="text-green-300 font-medium mb-1">Advanced</div>
              <div className="space-y-1 text-xs text-gray-300">
                <div><code>||spoiler||</code> → Hidden text</div>
                <div><code>==highlight==</code> → Highlighted</div>
                <div><code>&gt; quote</code> → Block quote</div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
            💡 Start typing formatting characters for smart suggestions!
          </div>
        </div>
      )}

      {/* Helper text */}
      {value.length === 0 && (
        <div className="text-xs text-gray-500 mt-2">
          Start typing... Try **bold**, *italic*, `code`, or ||spoiler||
        </div>
      )}
    </div>
  );
};