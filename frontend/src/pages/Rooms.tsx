import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { GhostIdentity } from '../components/GhostIdentity';
import { SelfDestructButton } from '../components/SelfDestructButton';
import { DestructionTimer } from '../components/DestructionTimer';
import { Room } from '../types';

export const Rooms: React.FC = () => {
  
  const navigate = useNavigate();
  const { 
    ghost, 
    rooms, 
    isConnected, 
    connectionError,
    destroy 
  } = useChatStore();

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const hasRequestedRooms = useRef(false);

  
  const webSocket = useWebSocket(ghost);

  // Handle ghost identity loading and redirect
  useEffect(() => {
    
    // Set loading to false after initial render
    const initialTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    // Only redirect if we're certain there's no ghost after giving time for state to initialize
    if (!ghost) {
      const redirectTimeout = setTimeout(() => {
        navigate('/');
      }, 2000); // Give more time for state initialization
      
      return () => {
        clearTimeout(initialTimeout);
        clearTimeout(redirectTimeout);
      };
    }
    
    return () => clearTimeout(initialTimeout);
  }, [ghost, navigate]);

  // Fetch rooms on connect (fixed with ref to prevent spam)
  useEffect(() => {
    if (isConnected && !hasRequestedRooms.current) {
      hasRequestedRooms.current = true;
      webSocket.listRooms();
    }
  }, [isConnected]); // Fixed: removed webSocket from dependencies and use ref to prevent spam

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    const roomName = newRoomName.trim();
    const description = newRoomDescription.trim();
    
    const roomOptions = {
      description: description || undefined,
      is_public: true
    };
    
    webSocket.createRoom(roomName, roomOptions);
    setNewRoomName('');
    setNewRoomDescription('');
    setShowCreateForm(false);
  };

  const handleJoinRoom = (roomId: string) => {
    setJoinedRooms(prev => new Set([...prev, roomId]));
    navigate(`/chat?room=${roomId}`);
  };

  const handleSelfDestruct = async () => {
    try {
      if (ghost) {
        await fetch(`/api/ghost/${ghost.ghost_id}/destroy`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Error destroying ghost:', error);
    } finally {
      destroy();
      navigate('/');
    }
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

  const getRoomHeatColor = (heatLevel: number) => {
    if (heatLevel >= 0.8) return 'text-red-400';
    if (heatLevel >= 0.6) return 'text-orange-400';
    if (heatLevel >= 0.4) return 'text-yellow-400';
    if (heatLevel >= 0.2) return 'text-green-400';
    return 'text-blue-400';
  };

  const getHeatEmoji = (heatLevel: number, participantCount: number) => {
    if (participantCount === 0) return '💤';
    if (heatLevel >= 0.8) return '🔥';
    if (heatLevel >= 0.6) return '🌡️';
    if (heatLevel >= 0.4) return '⚡';
    if (heatLevel >= 0.2) return '✨';
    return '💭';
  };

  if (!ghost && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">👻</div>
          <div className="text-white text-xl">Loading ghost identity...</div>
          <div className="text-gray-400 text-sm mt-2">Please wait...</div>
        </div>
      </div>
    );
  }

  if (!ghost && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-white text-xl">No ghost identity found</div>
          <div className="text-gray-400 text-sm mt-2">Redirecting to landing page...</div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Debug info */}
      <div className="fixed top-4 right-4 bg-red-600 text-white p-2 text-xs rounded z-50">
        Debug: Ghost={ghost?.display_name || 'none'}, Connected={isConnected ? 'yes' : 'no'}
      </div>
      
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/chat')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Chat
            </button>
            {ghost && <GhostIdentity ghost={ghost} size="small" />}
            <DestructionTimer
              initialTimeLeft={ghost?.session_ttl || 900}
              onExpire={handleSelfDestruct}
              className="hidden sm:flex"
            />
          </div>
          <SelfDestructButton 
            onDestruct={handleSelfDestruct}
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏛️ Public Rooms
          </h1>
          <p className="text-gray-400 text-lg mb-4">
            Join ongoing conversations or create your own space
          </p>
          <div className="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-blue-300 text-sm">
              <strong>🕒 Rooms are available 24/7</strong> • Your messages have individual TTL • 
              You can delete your data anytime or it auto-deletes in 24h
            </p>
          </div>
        </div>

        {/* Create Room Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Available Rooms</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {showCreateForm ? 'Cancel' : '+ Create Room'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Create New Public Room</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g., Tech Discussion, Random Chat, Gaming..."
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    placeholder="What's this room about? Any rules or topics?"
                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateRoom}
                    disabled={!newRoomName.trim() || !isConnected}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Public Room
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">○ Disconnected</span>
              {connectionError && <span className="text-red-400">- {connectionError}</span>}
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🏜️</div>
              <h3 className="text-xl font-bold text-white mb-2">No Public Rooms Yet</h3>
              <p className="text-gray-400 mb-4">Be the first to create a conversation space!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Create First Room
              </button>
            </div>
          ) : (
            rooms.map((room: Room) => (
              <div
                key={room.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                {/* Room Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Created {formatTimeAgo(room.created_at)}
                    </p>
                  </div>
                  <div className="text-2xl">
                    {getHeatEmoji(room.heat_level, room.participant_count)}
                  </div>
                </div>

                {/* Room Description */}
                {room.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}

                {/* Room Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">
                      👻 {room.participant_count} active
                    </span>
                    <span className={`${getRoomHeatColor(room.heat_level)}`}>
                      Activity: {Math.round(room.heat_level * 100)}%
                    </span>
                  </div>
                </div>

                {/* Room Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={!isConnected}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {joinedRooms.has(room.id) ? 'Enter Room' : 'Join Conversation'}
                  </button>
                  
                  {room.participant_count > 0 && (
                    <div className="text-xs text-gray-500 text-center">
                      Live conversation in progress
                    </div>
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-600">
                  <div className="text-xs text-gray-400">
                    <div className="flex items-center space-x-1 mb-1">
                      <span>🔒</span>
                      <span className="font-medium">Your Privacy:</span>
                    </div>
                    <div>• Your messages self-destruct in 24h</div>
                    <div>• Delete your data anytime</div>
                    <div>• Room persists, your data doesn't</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-white mb-3">How Public Rooms Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
              <div>
                <div className="text-2xl mb-2">🏛️</div>
                <div className="font-medium text-white">Persistent Rooms</div>
                <div>Rooms stay active 24/7 and don't disappear</div>
              </div>
              <div>
                <div className="text-2xl mb-2">⏰</div>
                <div className="font-medium text-white">Individual TTL</div>
                <div>Your messages auto-delete in 24h, others control their own</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🗑️</div>
                <div className="font-medium text-white">Selective Deletion</div>
                <div>Delete only your data anytime without affecting others</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};