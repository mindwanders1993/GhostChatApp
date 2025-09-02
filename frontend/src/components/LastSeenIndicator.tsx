import React, { useState, useEffect } from 'react';

interface Props {
  ghostId: string;
  roomId?: string;
  className?: string;
}

export const LastSeenIndicator: React.FC<Props> = ({ 
  ghostId, 
  roomId, 
  className = '' 
}) => {
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLastSeen = async () => {
      try {
        const params = new URLSearchParams();
        if (roomId) params.append('room_id', roomId);
        
        const response = await fetch(
          `/api/ghost/${ghostId}/last-seen?${params.toString()}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setLastSeen(data.last_seen);
        }
      } catch (error) {
        console.error('Error fetching last seen:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLastSeen();
  }, [ghostId, roomId]);

  const formatLastSeen = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'online';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // More than 24 hours
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <span className={`text-xs text-gray-500 ${className}`}>
        ...
      </span>
    );
  }

  if (!lastSeen) {
    return (
      <span className={`text-xs text-gray-500 ${className}`}>
        offline
      </span>
    );
  }

  const formattedTime = formatLastSeen(lastSeen);
  const isOnline = formattedTime === 'online';

  return (
    <span className={`text-xs flex items-center space-x-1 ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-400' : 'bg-gray-500'
        }`} 
      />
      <span className={isOnline ? 'text-green-400' : 'text-gray-500'}>
        {formattedTime}
      </span>
    </span>
  );
};