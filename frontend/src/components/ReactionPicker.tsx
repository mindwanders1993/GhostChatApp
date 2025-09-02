import React, { useState } from 'react';

interface Props {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  position?: 'above' | 'below';
}

const COMMON_EMOJIS = [
  '👍', '👎', '😀', '😂', '😢', '😮', '😍', '🤔',
  '👏', '🔥', '💯', '❤️', '💀', '🙄', '😎', '🤝',
  '🎉', '⚡', '💡', '🚀', '🌟', '💪', '🙏', '👀'
];

export const ReactionPicker: React.FC<Props> = ({ 
  onSelectEmoji, 
  onClose, 
  position = 'above' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmojis = COMMON_EMOJIS.filter(emoji => 
    searchTerm === '' || emoji.includes(searchTerm)
  );

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <>
      {/* Backdrop to close picker when clicking outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Picker */}
      <div 
        className={`
          absolute z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-3
          ${position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'}
          left-0 w-64
        `}
      >
        {/* Search input */}
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            w-full mb-3 px-2 py-1 text-sm
            bg-gray-700 text-white rounded border border-gray-600
            focus:border-blue-500 focus:outline-none
          "
          autoFocus
        />
        
        {/* Emoji grid */}
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {filteredEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="
                w-8 h-8 text-lg hover:bg-gray-700 rounded transition-colors
                flex items-center justify-center
              "
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {filteredEmojis.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-4">
            No emojis found
          </div>
        )}
        
        {/* Instructions */}
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400 text-center">
            Click an emoji to react
          </div>
        </div>
      </div>
    </>
  );
};