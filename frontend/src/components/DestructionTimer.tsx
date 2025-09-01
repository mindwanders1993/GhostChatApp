import React, { useState, useEffect } from 'react';

interface Props {
  initialTimeLeft: number; // in seconds
  onExpire: () => void;
  warningThreshold?: number; // seconds before warning
  className?: string;
}

export const DestructionTimer: React.FC<Props> = ({ 
  initialTimeLeft, 
  onExpire, 
  warningThreshold = 300, // 5 minutes
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft <= warningThreshold && timeLeft > 0;
  const isExpired = timeLeft <= 0;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="text-xs text-gray-400">Self-destruct in:</div>
      <div 
        className={`
          font-mono 
          font-bold 
          px-2 
          py-1 
          rounded 
          ${isExpired 
            ? 'bg-gray-600 text-gray-400' 
            : isWarning 
              ? 'bg-red-600 text-white animate-pulse-danger' 
              : 'bg-gray-700 text-green-400'
          }
        `}
      >
        {isExpired ? 'EXPIRED' : formatTime(timeLeft)}
      </div>
      
      {isWarning && !isExpired && (
        <div className="text-red-400 text-xs animate-pulse">
          ⚠️ Destroying soon!
        </div>
      )}
      
      {isExpired && (
        <div className="text-gray-400 text-xs">
          💀 Session ended
        </div>
      )}
    </div>
  );
};