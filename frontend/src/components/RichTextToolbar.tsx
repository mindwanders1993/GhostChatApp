import React, { useState } from 'react';
import { formatText, RICH_TEXT_HELP } from '../utils/markdown';

interface Props {
  onFormat: (type: string) => void;
  onInsertText: (text: string) => void;
  className?: string;
}

interface FormatButton {
  id: string;
  label: string;
  icon: string;
  title: string;
  category: 'basic' | 'advanced' | 'structure' | 'special';
  shortcut?: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  // Basic formatting
  {
    id: 'bold',
    label: 'Bold',
    icon: '𝐁',
    title: 'Bold text (**text**)',
    category: 'basic',
    shortcut: 'Ctrl+B'
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: '𝐼',
    title: 'Italic text (*text*)',
    category: 'basic',
    shortcut: 'Ctrl+I'
  },
  {
    id: 'underline',
    label: 'Underline',
    icon: 'U̲',
    title: 'Underline text (__text__)',
    category: 'basic',
    shortcut: 'Ctrl+U'
  },
  {
    id: 'strikethrough',
    label: 'Strikethrough',
    icon: 'S̶',
    title: 'Strikethrough text (~~text~~)',
    category: 'basic'
  },
  
  // Code formatting
  {
    id: 'code',
    label: 'Code',
    icon: '</>',
    title: 'Inline code (`code`)',
    category: 'advanced',
    shortcut: 'Ctrl+`'
  },
  {
    id: 'codeblock',
    label: 'Code Block',
    icon: '{ }',
    title: 'Code block (```code```)',
    category: 'advanced'
  },
  
  // Structure
  {
    id: 'h1',
    label: 'Header 1',
    icon: 'H1',
    title: 'Large header (# Header)',
    category: 'structure'
  },
  {
    id: 'h2',
    label: 'Header 2',
    icon: 'H2',
    title: 'Medium header (## Header)',
    category: 'structure'
  },
  {
    id: 'h3',
    label: 'Header 3',
    icon: 'H3',
    title: 'Small header (### Header)',
    category: 'structure'
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: '"',
    title: 'Quote text (> quote)',
    category: 'structure'
  },
  {
    id: 'bulletlist',
    label: 'List',
    icon: '•',
    title: 'Bullet list (- item)',
    category: 'structure'
  },
  {
    id: 'numberedlist',
    label: 'Numbered List',
    icon: '1.',
    title: 'Numbered list (1. item)',
    category: 'structure'
  },
  
  // Special formatting
  {
    id: 'spoiler',
    label: 'Spoiler',
    icon: '👁',
    title: 'Spoiler text (||spoiler||)',
    category: 'special'
  },
  {
    id: 'highlight',
    label: 'Highlight',
    icon: '🖍',
    title: 'Highlight text (==text==)',
    category: 'special'
  },
  {
    id: 'keyboard',
    label: 'Key',
    icon: '⌘',
    title: 'Keyboard shortcut ([[Ctrl+C]])',
    category: 'special'
  },
];

export const RichTextToolbar: React.FC<Props> = ({ 
  onFormat, 
  onInsertText, 
  className = '' 
}) => {
  const [activeCategory, setActiveCategory] = useState<'basic' | 'advanced' | 'structure' | 'special'>('basic');
  const [showHelp, setShowHelp] = useState(false);

  const handleFormatClick = (button: FormatButton) => {
    switch (button.id) {
      case 'codeblock':
        onInsertText('```\n\n```');
        break;
      case 'bulletlist':
        onInsertText('- ');
        break;
      case 'numberedlist':
        onInsertText('1. ');
        break;
      case 'keyboard':
        onFormat('keyboard');
        break;
      default:
        onFormat(button.id);
    }
  };

  const categories = {
    basic: { label: 'Basic', icon: '𝐁' },
    advanced: { label: 'Code', icon: '</>' },
    structure: { label: 'Structure', icon: '#' },
    special: { label: 'Special', icon: '✨' }
  };

  const activeButtons = FORMAT_BUTTONS.filter(btn => btn.category === activeCategory);

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-2 ${className}`}>
      {/* Category Tabs */}
      <div className="flex mb-3 bg-gray-700/50 rounded-lg p-1">
        {Object.entries(categories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key as any)}
            className={`
              flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${activeCategory === key 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }
            `}
            title={`${category.label} formatting options`}
          >
            <span>{category.icon}</span>
            <span className="hidden sm:inline">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Format Buttons */}
      <div className="flex flex-wrap gap-1 mb-3">
        {activeButtons.map((button) => (
          <button
            key={button.id}
            onClick={() => handleFormatClick(button)}
            className="
              flex items-center justify-center
              w-8 h-8 rounded-md text-xs font-bold
              bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
              border border-gray-600 hover:border-gray-500
              transition-all duration-200
              touch-manipulation
              active:scale-95
            "
            title={button.title + (button.shortcut ? ` (${button.shortcut})` : '')}
          >
            {button.icon}
          </button>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-gray-500">
          {activeCategory === 'basic' && '💡 Select text to format it'}
          {activeCategory === 'advanced' && '🔧 For code and technical content'}
          {activeCategory === 'structure' && '📝 Headers, lists, and quotes'}
          {activeCategory === 'special' && '✨ Advanced formatting features'}
        </div>

        {/* Help Button */}
        <div className="relative">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="
              w-6 h-6 rounded-md text-xs
              bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200
              border border-gray-600 hover:border-gray-500
              transition-all duration-200
            "
            title="Formatting help"
          >
            ?
          </button>

          {/* Help Popup */}
          {showHelp && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowHelp(false)}
              />
              <div className="
                absolute bottom-full right-0 mb-2 z-50
                bg-gray-800 border border-gray-600 rounded-lg shadow-xl
                p-4 w-96 max-w-[90vw] text-sm
              ">
                <h4 className="font-bold text-white mb-3 flex items-center">
                  <span className="text-blue-400 mr-2">✨</span>
                  Rich Text Formatting Guide
                </h4>
                <div className="space-y-3 text-gray-300 max-h-64 overflow-y-auto">
                  
                  <div>
                    <h5 className="font-semibold text-blue-300 mb-1">Basic Formatting</h5>
                    <div className="space-y-1 text-xs">
                      <div><code className="text-green-300">**bold**</code> → <strong>bold</strong></div>
                      <div><code className="text-green-300">*italic*</code> → <em>italic</em></div>
                      <div><code className="text-green-300">__underline__</code> → <u>underline</u></div>
                      <div><code className="text-green-300">~~strike~~</code> → <del>strikethrough</del></div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-blue-300 mb-1">Code & Links</h5>
                    <div className="space-y-1 text-xs">
                      <div><code className="text-green-300">`code`</code> → inline code</div>
                      <div><code className="text-green-300">```code```</code> → code block</div>
                      <div><code className="text-green-300">[text](url)</code> → link</div>
                      <div>Auto-detects URLs: https://example.com</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-blue-300 mb-1">Structure</h5>
                    <div className="space-y-1 text-xs">
                      <div><code className="text-green-300"># Header 1</code> → Large header</div>
                      <div><code className="text-green-300">## Header 2</code> → Medium header</div>
                      <div><code className="text-green-300">&gt; Quote</code> → Blockquote</div>
                      <div><code className="text-green-300">- Item</code> → Bullet list</div>
                      <div><code className="text-green-300">1. Item</code> → Numbered list</div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-blue-300 mb-1">Special</h5>
                    <div className="space-y-1 text-xs">
                      <div><code className="text-green-300">||spoiler||</code> → Hidden text</div>
                      <div><code className="text-green-300">==highlight==</code> → Highlighted text</div>
                      <div><code className="text-green-300">[[Ctrl+C]]</code> → Keyboard key</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    💡 Tip: Select text and click buttons, or type syntax directly!
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};