import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '../types/chat';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8000';

interface UseSocketProps {
  token: string;  // JWT token for authentication
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useSocket = ({
  token,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Create socket connection function without useCallback to avoid dependency cycles
  const createSocket = () => {
    if (!token || socketRef.current?.connected) return;

    console.log('Creating Socket.IO connection');

    const socket = io(WS_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      onDisconnect?.();

      // Don't attempt reconnection if manually disconnected
      if (reason === 'io client disconnect') {
        return;
      }

      // Schedule reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          createSocket();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
        setConnectionError('Connection failed. Please refresh the page.');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      onError?.(error);
      
      // Schedule reconnection on error
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          createSocket();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
        setConnectionError('Connection failed. Please refresh the page.');
      }
    });

    socket.onAny((eventName, data) => {
      if (eventName !== 'connect' && eventName !== 'disconnect' && eventName !== 'connect_error') {
        onMessage?.({ type: eventName, ...data });
      }
    });

    socketRef.current = socket;
  };

  // Simplified connect function
  const connect = useCallback(() => {
    createSocket();
  }, [token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setConnectionError(null);
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage, callback?: (response: any) => void) => {
    if (socketRef.current?.connected) {
      // Extract the type and send the data without the type field
      const { type, ...messageData } = message;
      socketRef.current.emit(type, messageData, (response: any) => {
        if (response?.error) {
          console.error(`WebSocket ${type} error:`, response.error);
          onError?.(new Error(response.error));
        } else {
          console.log(`WebSocket ${type} success:`, response);
        }
        callback?.(response);
      });
    } else {
      console.warn('Socket not connected, message not sent:', message);
      onError?.(new Error('Socket not connected'));
    }
  }, [onError]);

  const joinRoom = useCallback((roomId: string) => {
    console.log(`Attempting to join room: ${roomId}`);
    sendMessage({ type: 'join_room', room_id: roomId }, (response) => {
      if (response?.status === 'joined') {
        console.log(`Successfully joined room: ${roomId}`);
      }
    });
  }, [sendMessage]);

  const leaveRoom = useCallback((roomId: string, reason?: string) => {
    sendMessage({ type: 'leave_room', room_id: roomId, reason });
  }, [sendMessage]);

  const sendChatMessage = useCallback((roomId: string, content: string, messageType: string = 'text', formatting?: any, encryption?: {is_encrypted: boolean, encryption_iv: string, encryption_key_id: string}) => {
    console.log(`Attempting to send message to room: ${roomId}`, { 
      content: encryption?.is_encrypted ? '[ENCRYPTED]' : content.substring(0, 50) + '...', 
      messageType, 
      formatting,
      encrypted: encryption?.is_encrypted || false 
    });
    
    const messageData: any = {
      type: 'send_message',
      room_id: roomId,
      content,
      message_type: messageType,
      formatting,
      timestamp: new Date().toISOString(),
    };
    
    // Add encryption fields if provided
    if (encryption) {
      messageData.is_encrypted = encryption.is_encrypted;
      messageData.encryption_iv = encryption.encryption_iv;
      messageData.encryption_key_id = encryption.encryption_key_id;
    }
    
    sendMessage(messageData, (response) => {
      if (response?.status === 'sent') {
        console.log(`${encryption?.is_encrypted ? 'Encrypted' : 'Plaintext'} message sent successfully: ${response.message_id}`);
      }
    });
  }, [sendMessage]);

  const editMessage = useCallback((messageId: string, content: string, formatting?: any, roomId?: string) => {
    console.log(`Editing message: ${messageId}`, { content, formatting, roomId });
    sendMessage({
      type: 'edit_message',
      message_id: messageId,
      content,
      formatting,
      room_id: roomId,
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  const deleteMessage = useCallback((messageId: string, roomId?: string) => {
    console.log(`Deleting message: ${messageId}`, { roomId });
    sendMessage({
      type: 'delete_message',
      message_id: messageId,
      room_id: roomId,
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  const startTyping = useCallback((roomId: string) => {
    sendMessage({ type: 'typing_start', room_id: roomId });
  }, [sendMessage]);

  const stopTyping = useCallback((roomId: string) => {
    sendMessage({ type: 'typing_stop', room_id: roomId });
  }, [sendMessage]);

  // Connect on mount and when token changes
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token]); // Remove connect and disconnect from dependencies to prevent reconnection loop

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    sendMessage,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    reconnect: connect,
    disconnect,
  };
};