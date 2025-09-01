import React, { useState } from 'react';

interface Props {
  onDestruct: () => void;
  disabled?: boolean;
  className?: string;
}

export const SelfDestructButton: React.FC<Props> = ({ 
  onDestruct, 
  disabled = false,
  className = '' 
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const handleClick = () => {
    if (disabled) return;
    
    if (!isConfirming) {
      setIsConfirming(true);
      setCountdown(3);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsConfirming(false);
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Cancel if no action taken
      setTimeout(() => {
        clearInterval(timer);
        setIsConfirming(false);
        setCountdown(3);
      }, 3000);
    } else {
      onDestruct();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        px-4 
        py-2 
        rounded-lg 
        font-bold 
        text-sm 
        transition-all 
        duration-200
        ${disabled 
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
          : isConfirming
            ? 'bg-red-600 text-white animate-pulse-danger hover:bg-red-700'
            : 'bg-red-500 text-white hover:bg-red-600'
        }
        ${className}
      `}
    >
      {disabled ? (
        'DISABLED'
      ) : isConfirming ? (
        `DESTROYING IN ${countdown}...`
      ) : (
        '💀 SELF-DESTRUCT'
      )}
    </button>
  );
};