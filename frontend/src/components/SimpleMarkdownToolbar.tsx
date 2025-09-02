import React from 'react';

interface Props {
  onFormat: (type: 'bold' | 'italic' | 'code') => void;
  className?: string;
}

export const SimpleMarkdownToolbar: React.FC<Props> = ({ 
  onFormat, 
  className = '' 
}) => {
  const formatButtons = [
    {
      type: 'bold' as const,
      icon: '𝐁',
      label: 'Bold',
      shortcut: '**text**'
    },
    {
      type: 'italic' as const,
      icon: '𝐼',
      label: 'Italic',
      shortcut: '*text*'
    },
    {
      type: 'code' as const,
      icon: '</>',
      label: 'Code',
      shortcut: '`code`'
    }
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {formatButtons.map((button) => (
        <button
          key={button.type}
          onClick={() => onFormat(button.type)}
          className="
            flex items-center justify-center
            w-9 h-9 md:w-10 md:h-10 rounded-lg text-sm font-bold
            bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white
            border border-gray-600 hover:border-gray-500
            transition-all duration-200
            touch-manipulation
            active:scale-95
          "
          title={`${button.label} (${button.shortcut})`}
        >
          {button.icon}
        </button>
      ))}
      
      {/* Quick tip */}
      <div className="hidden sm:flex items-center text-xs text-gray-500 ml-4">
        💡 Select text to format
      </div>
    </div>
  );
};