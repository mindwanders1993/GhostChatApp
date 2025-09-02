import React, { useState } from 'react';
import { MessageReaction } from '../types';

interface Props {
  reactions: { [emoji: string]: MessageReaction };
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  currentUserId: string;
  className?: string;
}

export const MessageReactions: React.FC<Props> = ({ 
  reactions, 
  onAddReaction, 
  onRemoveReaction, 
  currentUserId,
  className = '' 
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  if (!reactions || Object.keys(reactions).length === 0) {
    return null;
  }

  const handleReactionClick = (emoji: string, reaction: MessageReaction) => {
    const userHasReacted = reaction.reactors.includes(currentUserId);
    
    if (userHasReacted) {
      onRemoveReaction(emoji);
    } else {
      onAddReaction(emoji);
    }
  };

  const getTooltipText = (reaction: MessageReaction) => {
    if (reaction.count === 1) {
      return reaction.displayNames[0] || `Ghost#${reaction.reactors[0]?.slice(-4)}`;
    } else if (reaction.count === 2) {
      return `${reaction.displayNames[0]} and ${reaction.displayNames[1]}`;
    } else if (reaction.count <= 3) {
      return reaction.displayNames.join(', ');
    } else {
      const first = reaction.displayNames.slice(0, 2).join(', ');
      return `${first} and ${reaction.count - 2} others`;
    }
  };

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${className}`}>
      {Object.entries(reactions).map(([emoji, reaction]) => {
        const userHasReacted = reaction.reactors.includes(currentUserId);
        
        return (
          <div key={emoji} className="relative">
            <button
              onClick={() => handleReactionClick(emoji, reaction)}
              onMouseEnter={() => setShowTooltip(emoji)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`
                inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs
                border transition-all duration-200 hover:scale-105
                ${userHasReacted 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              <span>{emoji}</span>
              <span className="font-medium">{reaction.count}</span>
            </button>
            
            {/* Tooltip */}
            {showTooltip === emoji && (
              <div className="
                absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50
                bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap
                border border-gray-700 shadow-lg
              ">
                {getTooltipText(reaction)}
                <div className="
                  absolute top-full left-1/2 transform -translate-x-1/2
                  border-4 border-transparent border-t-gray-900
                "></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};