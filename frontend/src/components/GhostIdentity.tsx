import React from 'react';
import { GhostIdentity as GhostIdentityType } from '../types';

interface Props {
  ghost: GhostIdentityType;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  className?: string;
}

export const GhostIdentity: React.FC<Props> = ({ 
  ghost, 
  size = 'medium', 
  showName = true,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm', 
    large: 'w-16 h-16 text-lg'
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          flex 
          items-center 
          justify-center 
          font-bold 
          animate-ghost-float
          border-2
          border-opacity-30
          border-white
        `}
        style={{
          backgroundColor: ghost.avatar.background_color,
          color: ghost.avatar.text_color
        }}
      >
        {ghost.avatar.emoji || ghost.avatar.initials}
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <span 
            className={`
              font-mono 
              font-semibold 
              text-white 
              ${textSizeClasses[size]}
            `}
          >
            {ghost.custom_name || ghost.display_name}
          </span>
          <div className="text-xs text-gray-400 font-mono">
            {ghost.age && ghost.gender && ghost.country ? (
              <span>{ghost.age} • {ghost.gender} • {ghost.country}</span>
            ) : (
              <span>#{ghost.ghost_id.slice(-4)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};