import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { WebSocketMessage, GhostIdentity } from '../types';

export const useWebSocket = (ghost: GhostIdentity | undefined) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const {
    setConnected,
    setConnectionError,
    setRooms,
    addRoom,
    addMessage,
    setMessages,
    addConnectedUser,
    removeConnectedUser,
    setConnectedUsers,
    addTypingUser,
    removeTypingUser,
    setStats
  } = useChatStore();

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection_established':
        console.log('Ghost connected:', message.display_name);
        break;

      case 'room_list':
        setRooms(message.rooms || []);
        break;

      case 'room_created':
        addRoom(message.room);
        break;

      case 'room_joined':
        setMessages(message.room_id, message.messages || []);
        setConnectedUsers(message.room_id, message.members || []);
        break;

      case 'room_left':
        // Room left handled in store
        break;

      case 'new_message':
        addMessage(message.message);
        break;

      case 'ghost_joined':
        addConnectedUser(message.room_id, {
          ghost_id: message.ghost_id,
          display_name: message.display_name || `Ghost#${message.ghost_id.slice(-4)}`
        });
        break;

      case 'ghost_left':
        removeConnectedUser(message.room_id, message.ghost_id);
        break;

      case 'typing_indicator':
        if (message.is_typing) {
          addTypingUser(message.room_id, message.display_name || `Ghost#${message.ghost_id.slice(-4)}`);
        } else {
          removeTypingUser(message.room_id, message.display_name || `Ghost#${message.ghost_id.slice(-4)}`);
        }
        break;

      case 'stats_update':
        setStats({
          active_ghosts: message.active_ghosts,
          total_rooms: message.total_rooms
        });
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        setConnectionError(message.message);
        break;

      case 'heartbeat':
        // Heartbeat received from server
        break;

      case 'pong':
        // Pong response to our ping
        break;

      case 'message_reaction':
        // Handle reaction updates
        useChatStore.getState().updateMessageReaction(
          message.message_id,
          message.reactions
        );
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [
    setRooms, addRoom, addMessage, setMessages, setConnectedUsers,
    addConnectedUser, removeConnectedUser, addTypingUser, 
    removeTypingUser, setStats, setConnectionError
  ]);

  const connect = useCallback(() => {
    console.log('WebSocket connect() called, ghost:', ghost?.ghost_id);
    
    if (!ghost) {
      console.log('WebSocket: No ghost identity, skipping connection');
      return;
    }
    
    // Prevent duplicate connections
    if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
      console.log('WebSocket: Already connecting/connected, skipping. State:', ws.current.readyState);
      return;
    }
    
    // Clean up any existing connection
    if (ws.current) {
      console.log('WebSocket: Closing existing connection');
      ws.current.close();
      ws.current = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/${ghost.ghost_id}`;
      
      console.log('WebSocket: Connecting to', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setConnectionError(undefined);
        reconnectAttempts.current = 0;
        
        // Start heartbeat
        heartbeatInterval.current = setInterval(() => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnected(false);
        
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
        
        // Only auto-reconnect for unexpected disconnections, not normal closes
        // Code 1000 = normal closure, 1001 = going away, 1008 = policy violation
        const shouldReconnect = ![1000, 1001, 1008].includes(event.code) && 
                               reconnectAttempts.current < maxReconnectAttempts &&
                               ghost; // Only reconnect if we still have a ghost identity
        
        if (shouldReconnect) {
          const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts.current), 15000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Connection lost. Maximum reconnection attempts exceeded.');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [ghost]); // Remove handleMessage to prevent recreation

  const disconnect = useCallback(() => {
    console.log('WebSocket disconnect() called');
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    
    if (ws.current) {
      console.log('WebSocket: Disconnecting, state:', ws.current.readyState);
      // Send close frame properly to prevent "no close frame" errors
      if (ws.current.readyState === WebSocket.OPEN) {
        ws.current.close(1000, 'Manual disconnect');
      } else if (ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close(1001, 'Connecting cancelled');
      }
      ws.current = null;
    }
    
    setConnected(false);
  }, [setConnected]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // WebSocket actions
  const joinRoom = useCallback((roomId: string) => {
    return sendMessage({ type: 'join_room', room_id: roomId });
  }, [sendMessage]);

  const leaveRoom = useCallback((roomId: string) => {
    return sendMessage({ type: 'leave_room', room_id: roomId });
  }, [sendMessage]);

  const sendChatMessage = useCallback((roomId: string, content: string) => {
    return sendMessage({ type: 'send_message', room_id: roomId, content });
  }, [sendMessage]);

  const createRoom = useCallback((roomName?: string, roomOptions?: any) => {
    return sendMessage({ type: 'create_room', room_name: roomName, room_options: roomOptions });
  }, [sendMessage]);

  const listRooms = useCallback(() => {
    return sendMessage({ type: 'list_rooms' });
  }, [sendMessage]);

  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    return sendMessage({ type: 'typing', room_id: roomId, is_typing: isTyping });
  }, [sendMessage]);

  const addReaction = useCallback((messageId: string, emoji: string, roomId: string) => {
    return sendMessage({ 
      type: 'add_reaction', 
      message_id: messageId, 
      emoji, 
      room_id: roomId 
    });
  }, [sendMessage]);

  const removeReaction = useCallback((messageId: string, emoji: string, roomId: string) => {
    return sendMessage({ 
      type: 'remove_reaction', 
      message_id: messageId, 
      emoji, 
      room_id: roomId 
    });
  }, [sendMessage]);

  // Auto-destruction on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // Remove disconnect from dependency to prevent re-running

  // Connection management
  useEffect(() => {
    if (ghost) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [ghost]); // Remove connect and disconnect from dependencies to prevent infinite loops

  return {
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    createRoom,
    listRooms,
    sendTyping,
    addReaction,
    removeReaction
  };
};