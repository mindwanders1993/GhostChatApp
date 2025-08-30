import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Menu,
  MenuItem,
  Divider,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  People,
  MoreVert,
  Close,
  ExitToApp,
  Send,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useSocket } from '../../hooks/useSocket';
import { logout } from '../../store/slices/authSlice';
import { addMessage, setConnected, editMessage, deleteMessage } from '../../store/slices/chatSlice';
import { showError, showSuccess, showInfo } from '../../store/slices/uiSlice';
import { WebSocketMessage } from '../../types/chat';
import RichTextComposer, { MessageFormatting } from '../MessageComposer/RichTextComposer';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import { useEncryption } from '../../hooks/useEncryption';
// EncryptedMessage type available if needed for future message decryption
import { EncryptionAppBarIndicator } from '../Common/EncryptionIndicator';

interface OnlineUser {
  id: string;
  nickname: string;
  isOnline: boolean;
  isTyping: boolean;
  lastSeen: string;
}

interface MessageWithMetadata {
  id: string;
  room_id: string;
  sender_id: string;
  sender_nickname?: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'emoji' | 'url' | 'audio' | 'whisper' | 'deleted';
  formatting?: Record<string, any>;
  sent_at: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  is_whisper?: boolean;
  whisper_to_id?: string;
  whisper_to_nickname?: string;
  reply_to_id?: string;
  mentioned_users?: string[];
  reactions?: any[];
  is_edited?: boolean;
  edited_at?: string;
}

const WhatsAppStyleChat: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);
  const { messages } = useAppSelector((state) => state.chat);
  
  // Encryption hook
  const { 
    encryptionStatus, 
    encryptMessage, 
    decryptMessage, 
    initializeRoom,
    cleanupRoom
  } = useEncryption();

  const [isConnected, setIsConnected] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userNicknames, setUserNicknames] = useState<{[key: string]: string}>({});
  const [editingMessage, setEditingMessage] = useState<{id: string; content: string; formatting?: MessageFormatting} | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentRoomId = roomId || 'fab24f41-4ca0-4615-b9bf-c2d21c1fb602';
  
  // Process messages and decrypt encrypted ones
  const roomMessages = useMemo(() => {
    const rawMessages = messages[currentRoomId] || [];
    
    // Process messages to decrypt any encrypted content
    const processedMessages = rawMessages.map(message => {
      // Only apply encryption detection to very long base64-like strings (typical of encrypted content)
      // and only if they look like actual encrypted payloads
      const isLikelyEncrypted = message.content && 
        message.content.length > 100 && // More conservative length check
        /^[A-Za-z0-9+/]{80,}={0,2}$/.test(message.content) && // Stricter base64 pattern
        !message.content.includes(' ') &&
        !message.content.includes('http') && // Not a URL
        !/^[a-zA-Z\s]+$/.test(message.content); // Not just letters and spaces
      
      if (isLikelyEncrypted) {
        // Return a copy with placeholder text for encrypted messages
        return {
          ...message,
          content: '[🔒 Encrypted message - encryption keys not available]',
          isEncryptedPlaceholder: true
        };
      }
      
      return message;
    });
    
    return processedMessages;
  }, [messages, currentRoomId]);

  const generateUserColor = (userId: string) => {
    const colors = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#ff9800'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getUserDisplayName = (userId: string, nickname?: string) => {
    if (userId === user?.id) return 'You';
    if (userId === 'system') return 'System';
    return nickname || userNicknames[userId] || `User${userId.substring(0, 8)}`;
  };
  


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function handleWebSocketMessage(message: WebSocketMessage) {
    console.log('📨 WebSocket message:', message);
    
    switch (message.type) {
      case 'message_received':
      case 'whisper_received':
      case 'reply_received':
        // Store sender nickname for future reference
        if (message.sender_id && message.sender_nickname) {
          setUserNicknames(prev => ({
            ...prev,
            [message.sender_id as string]: message.sender_nickname || ''
          }));
        }
        
        let messageContent = message.content || '';
        
        // Decrypt message if it's encrypted
        if (message.is_encrypted && message.encryption_iv && message.encryption_key_id) {
          try {
            console.log('🔓 Decrypting received message...');
            const decryptedMessage = await decryptMessage(
              {
                encryptedContent: messageContent,
                iv: message.encryption_iv,
                keyId: message.encryption_key_id
              },
              message.room_id || currentRoomId
            );
            messageContent = decryptedMessage.content;
            console.log('✅ Message decrypted successfully');
          } catch (error) {
            console.error('❌ Failed to decrypt message:', error);
            messageContent = '[🔒 Encrypted message - unable to decrypt]';
          }
        }
        
        const messageToAdd = {
          id: message.id || Date.now().toString(),
          room_id: message.room_id || currentRoomId,
          sender_id: message.sender_id || '',
          sender_nickname: message.sender_nickname || 'Anonymous', // Important!
          content: messageContent,
          message_type: (message.message_type as 'text' | 'image' | 'file' | 'emoji' | 'url' | 'audio' | 'whisper' | 'deleted') || 'text',
          sent_at: message.timestamp || new Date().toISOString(),
        };
        
        dispatch(addMessage(messageToAdd));
        break;
        
      case 'message_edited':
        // Handle message edit
        if (message.message_id && message.room_id) {
          dispatch(editMessage({
            roomId: message.room_id,
            messageId: message.message_id,
            content: message.content || '',
            formatting: message.formatting
          }));
        }
        break;
        
      case 'message_deleted':
        // Handle message deletion
        if (message.message_id && message.room_id) {
          dispatch(deleteMessage({
            roomId: message.room_id,
            messageId: message.message_id
          }));
        }
        break;
        
      case 'user_joined':
        if (message.user_id !== user?.id) {
          const nickname = message.user_nickname || 'Someone';
          
          // Store user nickname
          setUserNicknames(prev => ({
            ...prev,
            [message.user_id as string]: nickname
          }));
          
          dispatch(showInfo(`${nickname} joined`));
          
          setOnlineUsers(prev => {
            if (!prev.find(u => u.id === message.user_id)) {
              return [...prev, {
                id: message.user_id || '',
                nickname: nickname,
                isOnline: true,
                isTyping: false,
                lastSeen: new Date().toISOString()
              }];
            }
            return prev;
          });
        }
        break;
        
      case 'user_left':
        if (message.user_id !== user?.id) {
          const nickname = message.user_nickname || 'Someone';
          dispatch(showInfo(`${nickname} left`));
          setOnlineUsers(prev => prev.filter(u => u.id !== message.user_id));
        }
        break;
        
      case 'typing_start':
        if (message.user_id !== user?.id) {
          setTypingUsers(prev => {
            const newSet = new Set([...prev, message.user_id || '']);
            return Array.from(newSet);
          });
        }
        break;
        
      case 'typing_stop':
        if (message.user_id !== user?.id) {
          setTypingUsers(prev => prev.filter(id => id !== message.user_id));
        }
        break;
        
      case 'online_users_list':
        // Update online users list
        if (message.users) {
          setOnlineUsers(message.users.map((u: any) => ({
            id: u.user_id,
            nickname: u.user_nickname,
            isOnline: u.is_online,
            isTyping: u.is_typing,
            lastSeen: u.last_seen
          })));
        }
        break;
        
      case 'reaction_added':
        // Handle message reaction
        console.log('Reaction added:', message);
        break;
        
      case 'reaction_removed':
        // Handle reaction removal
        console.log('Reaction removed:', message);
        break;
        
      case 'mention_notification':
        // Handle mention notification
        dispatch(showInfo(`${message.mentioning_user} mentioned you`));
        break;
        
      case 'presence_updated':
        // Update user presence in online list
        setOnlineUsers(prev => prev.map(u => 
          u.id === message.user_id 
            ? { ...u, status_message: message.status_message }
            : u
        ));
        break;
        
      case 'error':
        dispatch(showError(message.message || 'An error occurred'));
        break;
    }
  }

  const { sendChatMessage, joinRoom, leaveRoom, startTyping, stopTyping, sendMessage, editMessage: editSocketMessage, deleteMessage: deleteSocketMessage } = useSocket({
    token: token || '',
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('✅ Connected to WebSocket');
      setIsConnected(true);
      dispatch(setConnected(true));
      dispatch(showSuccess('Connected'));
      joinRoom(currentRoomId);
      
      // Request online users list after joining
      setTimeout(() => {
        if (sendMessage) {
          sendMessage({
            type: 'get_online_users',
            room_id: currentRoomId
          });
        }
      }, 1000);
    },
    onDisconnect: () => {
      console.log('❌ Disconnected from WebSocket');
      setIsConnected(false);
      dispatch(setConnected(false));
      setOnlineUsers([]);
    },
    onError: (error) => {
      console.error('❌ WebSocket error:', error);
      dispatch(showError(`Connection error: ${error.message}`));
    },
  });

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  useEffect(() => {
    // Component initialization
  }, []);

  // Authentication guard - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/register', { replace: true });
      return;
    }
  }, [isAuthenticated, navigate]);

  // Initialize encryption for the room
  useEffect(() => {
    if (currentRoomId && encryptionStatus.supported) {
      initializeRoom(currentRoomId).catch(error => {
        console.error('Failed to initialize room encryption:', error);
        dispatch(showError('Failed to initialize end-to-end encryption'));
      });
    }
    
    // Cleanup encryption when leaving room
    return () => {
      if (currentRoomId) {
        cleanupRoom(currentRoomId);
      }
    };
  }, [currentRoomId, encryptionStatus.supported, initializeRoom, cleanupRoom, dispatch]);

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#075e54'
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  const handleSendMessage = async (content: string, formatting?: MessageFormatting) => {
    if (!content.trim() || !isConnected) return;

    try {
      // Temporarily disable encryption for basic functionality
      console.log('💬 Sending plaintext message:', content.substring(0, 20) + '...');
      sendChatMessage(currentRoomId, content.trim(), 'text', formatting);
    } catch (error) {
      console.error('Failed to encrypt/send message:', error);
      dispatch(showError('Failed to send message'));
    }
  };

  const handleEditMessage = (messageId: string, content: string, formatting?: MessageFormatting) => {
    if (!content.trim() || !isConnected) return;

    console.log('✏️ Editing message:', messageId, content, formatting);
    editSocketMessage(messageId, content, formatting, currentRoomId);
    setEditingMessage(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!isConnected) return;

    console.log('🗑️ Deleting message:', messageId);
    deleteSocketMessage(messageId, currentRoomId);
  };

  const handleStartEdit = (message: any) => {
    setEditingMessage({
      id: message.id,
      content: message.content,
      formatting: message.formatting
    });
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleStartTyping = () => {
    startTyping(currentRoomId);
  };

  const handleStopTyping = () => {
    stopTyping(currentRoomId);
  };

  const handleLeaveChat = () => {
    leaveRoom(currentRoomId, 'user_left');
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = (message: MessageWithMetadata, index: number) => {
    const isOwn = message.sender_id === user?.id;
    const isSystem = message.sender_id === 'system';
    const prevMessage = index > 0 ? roomMessages[index - 1] : null;
    const nextMessage = index < roomMessages.length - 1 ? roomMessages[index + 1] : null;
    
    const showName = !isOwn && !isSystem && (!prevMessage || prevMessage.sender_id !== message.sender_id);
    const showDate = !prevMessage || formatDate(message.sent_at) !== formatDate(prevMessage.sent_at);
    const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;
    const senderName = getUserDisplayName(message.sender_id, message.sender_nickname);
    const senderColor = generateUserColor(message.sender_id);
    
    return (
      <Box key={message.id}>
        {!isOwn && !isSystem && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5 }}>
            {message.sender_nickname || `User ${message.sender_id.substring(0, 8)}`}
          </Typography>
        )}
        <EnhancedMessageBubble
          message={message}
          isOwn={isOwn}
          isSystem={isSystem}
          showName={showName}
          showDate={showDate}
          isLastInGroup={isLastInGroup}
          senderName={senderName}
          senderColor={senderColor}
          currentUserId={user?.id || ''}
          isMobile={isMobile}
          onEdit={handleStartEdit}
          onDelete={handleDeleteMessage}
          onCopy={(content) => {
            navigator.clipboard.writeText(content);
            dispatch(showSuccess('Message copied!'));
          }}
          onReaction={(messageId, emoji) => {
            // TODO: Implement reaction functionality
            dispatch(showInfo(`Reacted with ${emoji}`));
          }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#e5ddd5' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={1}
        sx={{ 
          bgcolor: '#075e54',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: isMobile ? 56 : 64 }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
          )}
          
          <Avatar sx={{ 
            width: isMobile ? 35 : 40, 
            height: isMobile ? 35 : 40, 
            mr: 2, 
            bgcolor: '#128c7e' 
          }}>
            GL
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              sx={{ 
                color: 'white', 
                fontWeight: 500,
                lineHeight: 1.2 
              }}
            >
              General Lounge
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.8)', 
                display: 'block',
                lineHeight: 1 
              }}
            >
              {typingUsers.length > 0 
                ? `${typingUsers.length === 1 ? 'Someone is' : `${typingUsers.length} people are`} typing...`
                : `${onlineUsers.length} online`
              }
            </Typography>
          </Box>
          
          {/* Encryption Status Indicator */}
          <Box sx={{ mx: 1 }}>
            <EncryptionAppBarIndicator encryptionStatus={encryptionStatus} />
          </Box>
          
          <IconButton 
            color="inherit" 
            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
          >
            <Badge badgeContent={onlineUsers.length} color="error">
              <People />
            </Badge>
          </IconButton>
          
          <IconButton 
            color="inherit"
            onClick={(e) => setMenuAnchorEl(e.currentTarget)}
          >
            <MoreVert />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          py: 1,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="whatsapp-bg" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse"%3E%3Cg opacity="0.05"%3E%3Cpath d="M10 10h80v80H10z" fill="none" stroke="%23000" stroke-width="1"/%3E%3C/g%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23whatsapp-bg)"/%3E%3C/svg%3E")',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '3px',
          },
        }}
      >
        {roomMessages.map((message, index) => renderMessage(message, index))}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <Fade in={true}>
            <Box sx={{ px: isMobile ? 1 : 2, py: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'white',
                    p: 1.5,
                    borderRadius: '18px 18px 18px 4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <Box
                      key={i}
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: '#ccc',
                        borderRadius: '50%',
                        animation: 'typingDot 1.4s infinite ease-in-out',
                        animationDelay: `${i * 0.15}s`,
                        '@keyframes typingDot': {
                          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: 0.5 },
                          '40%': { transform: 'scale(1)', opacity: 1 }
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Fade>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(newMessage);
                setNewMessage('');
              }
            }}
            size="small"
          />
          <IconButton 
            color="primary"
            onClick={() => {
              handleSendMessage(newMessage);
              setNewMessage('');
            }}
            disabled={!newMessage.trim()}
          >
            <Send />
          </IconButton>
        </Box>
      </Box>

      {/* Online Users Drawer */}
      <Drawer
        anchor={isMobile ? 'right' : 'right'}
        open={showOnlineUsers}
        onClose={() => setShowOnlineUsers(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 300,
            bgcolor: 'white',
          },
        }}
      >
        <AppBar position="static" sx={{ bgcolor: '#075e54' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setShowOnlineUsers(false)}
            >
              <Close />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2, flex: 1 }}>
              Online Users ({onlineUsers.length})
            </Typography>
          </Toolbar>
        </AppBar>
        
        <List>
          {onlineUsers.map((onlineUser) => (
            <ListItem key={onlineUser.id}>
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        bgcolor: onlineUser.isOnline ? '#4caf50' : '#ccc',
                        borderRadius: '50%',
                        border: '2px solid white',
                      }}
                    />
                  }
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: generateUserColor(onlineUser.id),
                    }}
                  >
                    {onlineUser.nickname[0]?.toUpperCase()}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body1" fontWeight="medium">
                    {onlineUser.nickname}
                    {onlineUser.id === user?.id && ' (You)'}
                  </Typography>
                }
                secondary={
                  onlineUser.isTyping ? (
                    <Typography variant="caption" color="primary.main" sx={{ fontStyle: 'italic' }}>
                      typing...
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {onlineUser.isOnline ? 'Online' : `Last seen ${formatTime(onlineUser.lastSeen)}`}
                    </Typography>
                  )
                }
              />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* App Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setShowOnlineUsers(true);
          setMenuAnchorEl(null);
        }}>
          <People sx={{ mr: 2 }} />
          View Members
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          handleLeaveChat();
          setMenuAnchorEl(null);
        }}>
          <ExitToApp sx={{ mr: 2 }} />
          Leave Chat
        </MenuItem>
        <MenuItem onClick={() => {
          handleLogout();
          setMenuAnchorEl(null);
        }}>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default WhatsAppStyleChat;