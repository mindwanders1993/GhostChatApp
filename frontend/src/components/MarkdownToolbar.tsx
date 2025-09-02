import React, { useState } from 'react';

interface Props {
  onFormatText: (before: string, after?: string) => void;
  onInsertText: (text: string) => void;
  className?: string;
}

interface FormatButton {
  label: string;
  icon: string;
  before: string;
  after?: string;
  title: string;
}

const FORMATTING_BUTTONS: FormatButton[] = [
  {
    label: 'Bold',
    icon: '𝐁',
    before: '**',
    after: '**',
    title: 'Bold text (**text**)'
  },
  {
    label: 'Italic', 
    icon: '𝐼',
    before: '*',
    after: '*',
    title: 'Italic text (*text*)'
  },
  {
    label: 'Code',
    icon: '</>', 
    before: '`',
    after: '`',
    title: 'Inline code (`code`)'
  },
  {
    label: 'Link',
    icon: '🔗',
    before: '[',
    after: '](https://)',
    title: 'Link ([text](url))'
  },
  {
    label: 'Quote',
    icon: '"',
    before: '> ',
    title: 'Quote (> text)'
  },
  {
    label: 'List',
    icon: '•',
    before: '- ',
    title: 'List (- item)'
  },
];

export const MarkdownToolbar: React.FC<Props> = ({ 
  onFormatText, 
  onInsertText, 
  className = '' 
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const handleFormatClick = (button: FormatButton) => {
    if (button.after) {
      onFormatText(button.before, button.after);
    } else {
      onInsertText(button.before);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Formatting buttons */}
      <div className="flex items-center space-x-0.5 md:space-x-1 overflow-x-auto scrollbar-hide">
        {FORMATTING_BUTTONS.map((button, index) => (
          <button
            key={index}
            onClick={() => handleFormatClick(button)}
            className="
              flex items-center justify-center flex-shrink-0
              w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs font-bold
              bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
              border border-gray-600 hover:border-gray-500
              transition-all duration-200
            "
            title={button.title}
          >
            {button.icon}
          </button>
        ))}
        
        {/* Code block button */}
        <button
          onClick={() => onInsertText('```\n\n```')}
          className="
            flex items-center justify-center flex-shrink-0
            w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs font-bold
            bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
            border border-gray-600 hover:border-gray-500
            transition-all duration-200
          "
          title="Code block (```code```)"
        >
          {}
        </button>
      </div>

      {/* Help button */}
      <div className="relative">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="
            flex items-center justify-center 
            w-8 h-8 rounded-lg text-xs
            bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200
            border border-gray-600 hover:border-gray-500
            transition-all duration-200
          "
          title="Markdown help"
        >
          ?
        </button>

        {/* Help popover */}
        {showHelp && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowHelp(false)}
            />
            <div className="
              absolute bottom-full right-0 mb-2 z-50
              bg-gray-800 border border-gray-600 rounded-lg shadow-lg
              p-4 w-80 text-sm
            ">
              <h4 className="font-bold text-white mb-3">Markdown Formatting</h4>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span>Bold:</span>
                  <code className="text-blue-300">**text** or __text__</code>
                </div>
                <div className="flex justify-between">
                  <span>Italic:</span>
                  <code className="text-blue-300">*text* or _text_</code>
                </div>
                <div className="flex justify-between">
                  <span>Code:</span>
                  <code className="text-blue-300">`code`</code>
                </div>
                <div className="flex justify-between">
                  <span>Link:</span>
                  <code className="text-blue-300">[text](url)</code>
                </div>
                <div className="flex justify-between">
                  <span>Quote:</span>
                  <code className="text-blue-300">&gt; text</code>
                </div>
                <div className="flex justify-between">
                  <span>List:</span>
                  <code className="text-blue-300">- item</code>
                </div>
                <div className="flex justify-between">
                  <span>Code block:</span>
                  <code className="text-blue-300">```code```</code>
                </div>
                <div className="flex justify-between">
                  <span>Header:</span>
                  <code className="text-blue-300"># Title</code>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  💡 Tip: Select text and click buttons to format it!
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};