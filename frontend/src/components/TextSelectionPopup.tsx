import React, { useEffect, useState } from 'react';

interface Props {
  selection: {
    text: string;
    start: number;
    end: number;
  } | null;
  onFormat: (type: 'bold' | 'italic' | 'code') => void;
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement>;
}

export const TextSelectionPopup: React.FC<Props> = ({
  selection,
  onFormat,
  onClose,
  containerRef
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!selection || !containerRef.current) {
      setIsVisible(false);
      return;
    }

    const updatePosition = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const windowSelection = window.getSelection();
      
      if (!windowSelection || windowSelection.rangeCount === 0) {
        setIsVisible(false);
        return;
      }

      const range = windowSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Position popup above the selection
      const x = rect.left + (rect.width / 2) - 75; // Center popup (150px width / 2)
      const y = rect.top - 50; // 50px above selection
      
      // Keep popup within viewport
      const adjustedX = Math.max(10, Math.min(x, window.innerWidth - 160));
      const adjustedY = Math.max(10, y);
      
      setPosition({ x: adjustedX, y: adjustedY });
      setIsVisible(true);
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [selection, containerRef]);

  if (!isVisible || !selection) {
    return null;
  }

  const formatButtons = [
    {
      type: 'bold' as const,
      icon: '𝐁',
      label: 'Bold',
      className: 'font-bold'
    },
    {
      type: 'italic' as const,
      icon: '𝐼',
      label: 'Italic',
      className: 'italic'
    },
    {
      type: 'code' as const,
      icon: '</>',
      label: 'Code',
      className: 'font-mono'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-1 flex items-center space-x-1"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {formatButtons.map((button) => (
          <button
            key={button.type}
            onClick={() => onFormat(button.type)}
            className={`
              flex items-center justify-center
              w-10 h-10 rounded-md text-sm
              bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white
              border border-gray-600 hover:border-gray-500
              transition-all duration-150
              touch-manipulation
              ${button.className}
            `}
            title={button.label}
          >
            {button.icon}
          </button>
        ))}
      </div>
    </>
  );
};