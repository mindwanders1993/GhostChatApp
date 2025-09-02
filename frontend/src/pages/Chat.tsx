import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { GhostIdentity } from '../components/GhostIdentity';
import { DestructionTimer } from '../components/DestructionTimer';
import { SelfDestructButton } from '../components/SelfDestructButton';
import { UserCard } from '../components/UserCard';
import { PrivateConversationsList } from '../components/PrivateConversationsList';
import { MessageReactions } from '../components/MessageReactions';
import { ReactionPicker } from '../components/ReactionPicker';
import { SmartRichTextInput } from '../components/SmartRichTextInput';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { Message, Room } from '../types';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomParam = searchParams.get('room');
  
  const {
    ghost,
    currentRoom,
    rooms,
    messages,
    connectedUsers,
    isConnected,
    connectionError,
    typingUsers,
    setCurrentRoom,
    destroy
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showRoomCreator, setShowRoomCreator] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rightSidebarView, setRightSidebarView] = useState<'users' | 'private'>('users');
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const processedRoomRef = useRef<string | null>(null);

  const webSocket = useWebSocket(ghost);

  // Define handleJoinRoom early so it can be used in useEffect
  const handleJoinRoom = useCallback((roomId: string) => {
    if (currentRoom === roomId) return;
    
    if (currentRoom) {
      webSocket.leaveRoom(currentRoom);
    }
    
    webSocket.joinRoom(roomId);
    setCurrentRoom(roomId);
  }, [currentRoom, webSocket.leaveRoom, webSocket.joinRoom, setCurrentRoom]);

  // Redirect if no ghost identity
  useEffect(() => {
    if (!ghost) {
      navigate('/');
      return;
    }
  }, [ghost, navigate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentRoom]);

  // Fetch rooms on connect (temporarily disabled to debug)
  // useEffect(() => {
  //   if (isConnected) {
  //     webSocket.listRooms();
  //   }
  // }, [isConnected]); // Remove webSocket from dependencies to prevent infinite loop

  // Auto-join room from URL parameter - using ref to prevent loops
  useEffect(() => {
    if (isConnected && roomParam && roomParam !== processedRoomRef.current) {
      processedRoomRef.current = roomParam;
      handleJoinRoom(roomParam);
    }
  }, [isConnected, roomParam, handleJoinRoom]); // Include handleJoinRoom

  // Fetch user's message count when room changes
  useEffect(() => {
    if (currentRoom && ghost) {
      fetchUserMessageCount();
    }
  }, [currentRoom, ghost]);

  const fetchUserMessageCount = async () => {
    if (!ghost || !currentRoom) return;
    
    try {
      const response = await fetch(`/api/ghost/${ghost.ghost_id}/room-data/${currentRoom}`);
      if (response.ok) {
        const data = await response.json();
        setUserMessageCount(data.message_count);
      }
    } catch (error) {
      console.error('Error fetching user message count:', error);
    }
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!isTyping && currentRoom) {
      setIsTyping(true);
      webSocket.sendTyping(currentRoom, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (currentRoom) {
        setIsTyping(false);
        webSocket.sendTyping(currentRoom, false);
      }
    }, 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !currentRoom || !isConnected) return;

    webSocket.sendChatMessage(currentRoom, messageInput.trim());
    setMessageInput('');
    
    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      webSocket.sendTyping(currentRoom, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    // Update message count
    setTimeout(() => {
      fetchUserMessageCount();
    }, 500);
  };


  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    webSocket.createRoom(newRoomName.trim());
    setNewRoomName('');
    setShowRoomCreator(false);
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

  const handleDeleteRoomData = async () => {
    if (!ghost || !currentRoom || isDeleting) return;
    
    if (!window.confirm(`Delete all your messages from this room? This action cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ghost/${ghost.ghost_id}/delete-room-data/${currentRoom}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Deleted ${result.deleted_count} messages`);
        
        // Refresh the messages and count
        webSocket.leaveRoom(currentRoom);
        setTimeout(() => {
          webSocket.joinRoom(currentRoom);
          fetchUserMessageCount();
        }, 500);
      } else {
        console.error('Failed to delete user data');
      }
    } catch (error) {
      console.error('Error deleting user data:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reaction handlers
  const handleAddReaction = (messageId: string, emoji: string) => {
    if (currentRoom) {
      webSocket.addReaction(messageId, emoji, currentRoom);
    }
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    if (currentRoom) {
      webSocket.removeReaction(messageId, emoji, currentRoom);
    }
  };

  const handleShowReactionPicker = (messageId: string) => {
    setShowReactionPicker(messageId);
  };

  const handleCloseReactionPicker = () => {
    setShowReactionPicker(null);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!ghost) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">👻</div>
          <div className="text-white text-xl">Loading ghost identity...</div>
          <div className="text-gray-400 text-sm mt-2">Please wait...</div>
        </div>
      </div>
    );
  }

  const currentRoomMessages = currentRoom ? messages[currentRoom] || [] : [];
  const currentRoomUsers = currentRoom ? connectedUsers[currentRoom] || [] : [];
  const currentRoomTyping = currentRoom ? typingUsers[currentRoom] || [] : [];

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Left Sidebar - Rooms & Private Conversations */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Sidebar Navigation Tabs */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex bg-gray-700/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setRightSidebarView('users')}
              className={`
                flex-1 text-sm py-3 px-4 rounded-lg transition-all duration-200 font-medium
                ${rightSidebarView === 'users' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }
              `}
            >
              🏛️ Public Rooms
            </button>
            <button
              onClick={() => setRightSidebarView('private')}
              className={`
                flex-1 text-sm py-3 px-4 rounded-lg transition-all duration-200 font-medium
                ${rightSidebarView === 'private' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }
              `}
            >
              💬 Private Chats
            </button>
          </div>

          {rightSidebarView === 'users' && (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Public Rooms</h2>
              <button
                onClick={() => setShowRoomCreator(!showRoomCreator)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + Create
              </button>
            </div>
          )}

          {rightSidebarView === 'private' && (
            <h2 className="text-lg font-bold text-white">Private Conversations</h2>
          )}
          
          {rightSidebarView === 'users' && showRoomCreator && (
            <div className="space-y-2">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name..."
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateRoom}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowRoomCreator(false)}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {rightSidebarView === 'users' ? (
            // Public Rooms List
            rooms.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No active rooms
              </div>
            ) : (
              rooms.map((room: Room) => (
                <button
                  key={room.id}
                  onClick={() => handleJoinRoom(room.id)}
                  className={`
                    w-full 
                    p-4 
                    mx-2
                    mb-2
                    text-left 
                    rounded-xl
                    hover:bg-gray-700/50
                    transition-all
                    duration-200
                    ${currentRoom === room.id ? 'bg-blue-600/20 border-blue-500/30 border' : 'bg-gray-700/30'}
                    group
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                      {room.name}
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="text-xs text-gray-400">
                        {room.participant_count}
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {room.description || `Created ${new Date(room.created_at).toLocaleTimeString()}`}
                  </div>
                </button>
              ))
            )
          ) : (
            // Private Conversations List
            <div className="p-4">
              <PrivateConversationsList 
                onSelectRoom={handleJoinRoom}
                currentRoom={currentRoom}
              />
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-700">
          <div className={`
            text-xs 
            font-mono 
            ${isConnected ? 'text-green-400' : 'text-red-400'}
          `}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </div>
          {connectionError && (
            <div className="text-xs text-red-400 mt-1">
              {connectionError}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <GhostIdentity ghost={ghost} size="small" />
              <DestructionTimer
                initialTimeLeft={ghost.session_ttl}
                onExpire={handleSelfDestruct}
                className="hidden sm:flex"
              />
              <button
                onClick={() => navigate('/rooms')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                🏛️ Public Rooms
              </button>
            </div>
            <SelfDestructButton 
              onDestruct={handleSelfDestruct}
              disabled={!isConnected}
            />
          </div>
        </div>

        {/* Chat Content */}
        {!currentRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">👻</div>
              <div className="text-xl mb-2">Select a room to start chatting</div>
              <div className="text-sm">Or create a new room to begin</div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {currentRoomMessages.length === 0 ? (
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <div>No messages yet. Start the conversation!</div>
                </div>
              ) : (
                currentRoomMessages.map((message: Message, index) => {
                  const isOwn = message.sender === ghost.ghost_id;
                  const showSender = !isOwn && (
                    index === 0 || 
                    currentRoomMessages[index - 1]?.sender !== message.sender
                  );
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        {showSender && (
                          <div className="text-xs text-gray-400 mb-1 px-3">
                            {message.sender_display || `Ghost#${message.sender.slice(-4)}`}
                          </div>
                        )}
                        <div className="relative">
                          <div
                            className={`
                              max-w-xs lg:max-w-md px-3 py-2 rounded-2xl relative group
                              ${isOwn 
                                ? 'bg-blue-500 text-white rounded-br-md' 
                                : 'bg-gray-700 text-white rounded-bl-md'
                              }
                              shadow-sm
                            `}
                          >
                            <MarkdownRenderer content={message.content} />
                            <div className={`
                              text-xs mt-1 
                              ${isOwn ? 'text-blue-100' : 'text-gray-400'}
                              float-right ml-2
                            `}>
                              {formatMessageTime(message.timestamp)}
                              {isOwn && <span className="ml-1">✓</span>}
                            </div>
                            <div className="clear-both"></div>
                            
                            {/* Reaction button - shows on hover */}
                            <button
                              onClick={() => handleShowReactionPicker(message.id)}
                              className="
                                absolute -bottom-2 -right-2 w-6 h-6 
                                bg-gray-600 hover:bg-gray-500 rounded-full
                                flex items-center justify-center text-xs
                                opacity-0 group-hover:opacity-100 transition-opacity
                                border border-gray-500
                              "
                              title="Add reaction"
                            >
                              😊
                            </button>
                          </div>
                          
                          {/* Reaction picker */}
                          {showReactionPicker === message.id && (
                            <ReactionPicker
                              onSelectEmoji={(emoji) => handleAddReaction(message.id, emoji)}
                              onClose={handleCloseReactionPicker}
                              position="above"
                            />
                          )}
                          
                          {/* Message reactions */}
                          {message.reactions && (
                            <MessageReactions
                              reactions={message.reactions}
                              onAddReaction={(emoji) => handleAddReaction(message.id, emoji)}
                              onRemoveReaction={(emoji) => handleRemoveReaction(message.id, emoji)}
                              currentUserId={ghost.ghost_id}
                              className={isOwn ? 'justify-end' : 'justify-start'}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicators */}
              {currentRoomTyping.length > 0 && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {currentRoomTyping.length === 1
                          ? `${currentRoomTyping[0]} is typing`
                          : `${currentRoomTyping.length} people are typing`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <SmartRichTextInput
                    value={messageInput}
                    onChange={(value) => {
                      setMessageInput(value);
                      handleTypingStart();
                    }}
                    onSubmit={() => {
                      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                      handleSendMessage(fakeEvent);
                    }}
                    placeholder={isConnected ? "Type a message..." : "Connecting..."}
                    disabled={!isConnected}
                    maxLength={2000}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !isConnected}
                  className={`
                    w-12 
                    h-12 
                    rounded-full
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-200
                    ${messageInput.trim() && isConnected
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg transform hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }
                  `}
                  title="Send message"
                >
                  <svg className="w-5 h-5 transform rotate-45" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar - Users & Data Controls */}
      {currentRoom && (
        <div className="w-72 bg-gray-800 border-l border-gray-700 p-4 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">
            In Room ({currentRoomUsers.length})
          </h3>
          
          {/* User List */}
          <div className="space-y-2 mb-6">
            {currentRoomUsers.map((user) => (
              <UserCard
                key={user.ghost_id}
                userId={user.ghost_id}
                displayName={user.ghost_id === ghost.ghost_id ? 'You' : user.display_name}
                isCurrentUser={user.ghost_id === ghost.ghost_id}
                onMessageUser={() => {
                  // Refresh private rooms after creating a new one
                  setTimeout(() => {
                    // This will trigger a refresh of private rooms
                    setRightSidebarView('private');
                  }, 1000);
                }}
              />
            ))}
          </div>

          {/* Data Management Section */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-bold text-white mb-3">Your Data</h4>
            
            <div className="bg-gray-900 rounded-lg p-3 mb-3">
              <div className="text-xs text-gray-400 mb-1">Messages in this room:</div>
              <div className="text-lg font-bold text-white">{userMessageCount}</div>
            </div>

            {userMessageCount > 0 && (
              <button
                onClick={handleDeleteRoomData}
                disabled={isDeleting}
                className="w-full bg-red-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : '🗑️ Delete My Data'}
              </button>
            )}

            <div className="text-xs text-gray-400 mt-3">
              <div>• Your messages auto-delete in 24h</div>
              <div>• Delete anytime manually</div>
              <div>• Room persists, your data doesn't</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};