import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { Room } from '../types';

interface PrivateConversationsListProps {
  onSelectRoom: (roomId: string) => void;
  currentRoom?: string;
}

export const PrivateConversationsList: React.FC<PrivateConversationsListProps> = ({
  onSelectRoom,
  currentRoom
}) => {
  const { ghost, privateRooms, setPrivateRooms } = useChatStore();
  const [loading, setLoading] = useState(false);

  // Fetch private rooms
  const fetchPrivateRooms = async () => {
    if (!ghost) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/ghost/${ghost.ghost_id}/private-rooms`);
      if (response.ok) {
        const data = await response.json();
        setPrivateRooms(data.private_rooms);
      }
    } catch (error) {
      console.error('Error fetching private rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivateRooms();
  }, [ghost]);

  // Get the other participant's name for display
  const getOtherParticipantName = (room: Room): string => {
    if (!room.participants || !ghost) return 'Unknown User';
    
    const otherParticipant = room.participants.find(p => p !== ghost.ghost_id);
    if (!otherParticipant) return 'Unknown User';
    
    // Extract display name from room name if available
    const roomName = room.name || '';
    if (roomName.includes('Private: ')) {
      const names = roomName.replace('Private: ', '').split(' & ');
      return names.find(name => !name.includes(ghost.display_name || '')) || `Ghost#${otherParticipant.slice(-4)}`;
    }
    
    return `Ghost#${otherParticipant.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const created = new Date(timestamp).getTime();
    const diff = now - created;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="text-sm">Loading conversations...</div>
      </div>
    );
  }

  if (privateRooms.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <div className="text-2xl mb-2">💬</div>
        <div className="text-sm">No private conversations yet</div>
        <div className="text-xs text-gray-500 mt-1">
          Message someone from a public room to start
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {privateRooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelectRoom(room.id)}
          className={`
            w-full 
            p-3 
            text-left 
            rounded-lg
            hover:bg-gray-700
            transition-colors
            ${currentRoom === room.id ? 'bg-blue-900 border border-blue-600' : 'bg-gray-800'}
          `}
        >
          <div className="flex items-start justify-between mb-1">
            <div className="font-medium text-white">
              {getOtherParticipantName(room)}
            </div>
            <div className="text-xs text-gray-400">
              {formatTimeAgo(room.created_at)}
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Private conversation
          </div>
          
          {/* Unread indicator (placeholder for future implementation) */}
          {false && (
            <div className="flex justify-end mt-1">
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                2
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};