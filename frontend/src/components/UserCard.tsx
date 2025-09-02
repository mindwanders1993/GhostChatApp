import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { LastSeenIndicator } from './LastSeenIndicator';

interface UserCardProps {
  userId: string;
  displayName?: string;
  isCurrentUser?: boolean;
  onMessageUser?: () => void;
  currentRoomId?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  userId,
  displayName,
  isCurrentUser = false,
  onMessageUser,
  currentRoomId
}) => {
  const navigate = useNavigate();
  const { ghost } = useChatStore();

  const handleSendMessage = async () => {
    if (!ghost) return;
    
    try {
      const response = await fetch(`/api/ghost/${ghost.ghost_id}/private-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_ghost_id: userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Call callback if provided
        onMessageUser?.();
        // Navigate to the private room using React Router
        navigate(`/chat?room=${data.room.id}`);
      }
    } catch (error) {
      console.error('Error creating private room:', error);
    }
  };

  // Generate a consistent color based on userId
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (name: string) => {
    if (!name || name === 'You') return isCurrentUser ? 'Y' : 'G';
    return name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`
        p-3 
        rounded-xl 
        ${isCurrentUser ? 'bg-blue-900/30 border-blue-500/20 border' : 'bg-gray-700/50'}
        group
        hover:bg-gray-600/50
        transition-all
        duration-200
        cursor-pointer
      `}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
          ${isCurrentUser ? 'bg-blue-500' : getAvatarColor(userId)}
        `}>
          {getInitials(displayName || `Ghost#${userId.slice(-4)}`)}
        </div>
        
        <div className="flex-1">
          <div className="text-sm text-white font-medium">
            {isCurrentUser ? 'You' : displayName || `Ghost#${userId.slice(-4)}`}
          </div>
          {!isCurrentUser ? (
            <LastSeenIndicator 
              ghostId={userId} 
              roomId={currentRoomId}
              className="mt-1"
            />
          ) : (
            <div className="text-xs text-green-400 mt-1">online</div>
          )}
        </div>
        
        {!isCurrentUser && (
          <button
            onClick={handleSendMessage}
            className="
              opacity-0 
              group-hover:opacity-100 
              bg-blue-600 
              hover:bg-blue-700 
              text-white 
              text-xs 
              px-3 
              py-1.5 
              rounded-full
              transition-all
              duration-200
              font-medium
              shadow-sm
              hover:shadow-md
            "
          >
            💬 Message
          </button>
        )}
      </div>
    </div>
  );
};