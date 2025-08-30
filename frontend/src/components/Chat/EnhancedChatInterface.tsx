import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  Avatar,
  Button,
  Drawer,
  Chip,
  Divider,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Badge,
  Fade,
  Slide,
  useTheme,
} from '@mui/material';
import {
  Send,
  ExitToApp,
  People,
  Menu as MenuIcon,
  Close,
  Circle,
  PersonAdd,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useSocket } from '../../hooks/useSocket';
import { logout } from '../../store/slices/authSlice';
import { addMessage, setConnected } from '../../store/slices/chatSlice';
import { showError, showSuccess, showInfo } from '../../store/slices/uiSlice';
import { WebSocketMessage } from '../../types/chat';

interface OnlineUser {
  id: string;
  nickname: string;
  avatar: string;
  isTyping: boolean;
  lastSeen: string;
}

const EnhancedChatInterface: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);
  const { messages } = useAppSelector((state) => state.chat);

  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [userMessages, setUserMessages] = useState<{[key: string]: any}>({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const currentRoomId = roomId || 'fab24f41-4ca0-4615-b9bf-c2d21c1fb602'; // General Lounge
  const roomMessages = messages[currentRoomId] || [];

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
  }, [isAuthenticated, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateUserColor = (userId: string) => {
    const colors = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ff9800', '#ff5722', '#795548', '#607d8b'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getUserNickname = (userId: string) => {
    if (userId === user?.id) return 'You';
    if (userId === 'system') return 'System';
    
    // Try to get from stored user messages
    if (userMessages[userId]?.nickname) {
      return userMessages[userId].nickname;
    }
    
    // Try to get from online users
    const onlineUser = onlineUsers.find(u => u.id === userId);
    if (onlineUser) return onlineUser.nickname;
    
    return `User ${userId.substring(0, 8)}...`;
  };

  function handleWebSocketMessage(message: WebSocketMessage) {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'message_received':
        // Store sender info for future reference
        if (message.sender_id && message.sender_nickname) {
          setUserMessages(prev => ({
            ...prev,
            [message.sender_id as string]: {
              nickname: message.sender_nickname,
              lastSeen: new Date().toISOString()
            }
          }));
        }
        
        dispatch(addMessage({
          id: message.id || Date.now().toString(),
          room_id: message.room_id || '',
          sender_id: message.sender_id || '',
          content: message.content || '',
          message_type: 'text',
          sent_at: message.timestamp || new Date().toISOString(),
        }));
        break;
        
      case 'user_joined':
        if (message.user_id !== user?.id) {
          const nickname = message.user_nickname || 'Someone';
          dispatch(showInfo(`${nickname} joined the room`));
          
          // Add to online users
          setOnlineUsers(prev => {
            if (!prev.find(u => u.id === message.user_id)) {
              return [...prev, {
                id: message.user_id || '',
                nickname: nickname,
                avatar: nickname[0]?.toUpperCase() || 'U',
                isTyping: false,
                lastSeen: new Date().toISOString()
              }];
            }
            return prev;
          });
          
          // Add system message
          dispatch(addMessage({
            id: `join_${Date.now()}`,
            room_id: currentRoomId,
            sender_id: 'system',
            content: `${nickname} joined the General Lounge`,
            message_type: 'text',
            sent_at: new Date().toISOString(),
          }));
        }
        break;
        
      case 'user_left':
        if (message.user_id !== user?.id) {
          const nickname = getUserNickname(message.user_id || '');
          dispatch(showInfo(`${nickname} left the room`));
          
          // Remove from online users
          setOnlineUsers(prev => prev.filter(u => u.id !== message.user_id));
          
          // Add system message
          dispatch(addMessage({
            id: `leave_${Date.now()}`,
            room_id: currentRoomId,
            sender_id: 'system',
            content: `${nickname} left the room`,
            message_type: 'text',
            sent_at: new Date().toISOString(),
          }));
        }
        break;
        
      case 'typing_start':
        if (message.user_id !== user?.id) {
          setTypingUsers(prev => {
            if (message.user_id) {
              const newSet = new Set([...prev, message.user_id]);
              return Array.from(newSet);
            }
            return prev;
          });
          setOnlineUsers(prev => 
            prev.map(u => u.id === message.user_id ? {...u, isTyping: true} : u)
          );
        }
        break;
        
      case 'typing_stop':
        if (message.user_id !== user?.id) {
          setTypingUsers(prev => prev.filter(id => id !== message.user_id));
          setOnlineUsers(prev => 
            prev.map(u => u.id === message.user_id ? {...u, isTyping: false} : u)
          );
        }
        break;
        
      case 'online_users':
        if (message.users) {
          setOnlineUsers(message.users.map((u: any) => ({
            id: u.user_id || u.id,
            nickname: u.nickname || u.user_nickname || `User ${u.user_id?.substring(0, 8)}...`,
            avatar: (u.nickname || u.user_nickname || 'U')[0]?.toUpperCase(),
            isTyping: false,
            lastSeen: new Date().toISOString()
          })));
        }
        break;
        
      case 'error':
        dispatch(showError(message.message || 'An error occurred'));
        break;
    }
  }

  const { sendChatMessage, joinRoom, leaveRoom, startTyping, stopTyping } = useSocket({
    token: token || '',
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      dispatch(setConnected(true));
      dispatch(showSuccess('Connected to chat'));
      joinRoom(currentRoomId);
    },
    onDisconnect: () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
      dispatch(setConnected(false));
      setOnlineUsers([]);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      dispatch(showError(`Connection error: ${error.message}`));
    },
  });

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  // Add current user to online users when connected
  useEffect(() => {
    if (isConnected && user) {
      setOnlineUsers(prev => {
        if (!prev.find(u => u.id === user.id)) {
          return [...prev, {
            id: user.id,
            nickname: user.nickname,
            avatar: user.nickname[0]?.toUpperCase() || 'U',
            isTyping: false,
            lastSeen: new Date().toISOString()
          }];
        }
        return prev;
      });
    }
  }, [isConnected, user]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    console.log('Sending message:', newMessage);
    sendChatMessage(currentRoomId, newMessage.trim(), 'text');
    setNewMessage('');
    handleStopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      startTyping(currentRoomId);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      stopTyping(currentRoomId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  const renderMessage = (message: any, index: number) => {
    const isOwn = message.sender_id === user?.id;
    const isSystem = message.sender_id === 'system';
    const senderNickname = getUserNickname(message.sender_id);
    const prevMessage = index > 0 ? roomMessages[index - 1] : null;
    const showAvatar = !isOwn && !isSystem && (!prevMessage || prevMessage.sender_id !== message.sender_id);
    
    if (isSystem) {
      return (
        <ListItem key={message.id} sx={{ justifyContent: 'center', py: 0.5 }}>
          <Chip 
            label={message.content} 
            size="small" 
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.1)',
              fontSize: '0.75rem'
            }} 
          />
        </ListItem>
      );
    }
    
    return (
      <ListItem
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end',
          mb: 0.5,
          px: 1
        }}
      >
        {!isOwn && (
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              mr: 1,
              mb: 0.5,
              bgcolor: generateUserColor(message.sender_id),
              fontSize: '0.875rem',
              visibility: showAvatar ? 'visible' : 'hidden'
            }}
          >
            {senderNickname[0]?.toUpperCase()}
          </Avatar>
        )}
        
        <Box sx={{ maxWidth: '70%', ml: !isOwn && !showAvatar ? '40px' : 0 }}>
          {!isOwn && showAvatar && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                ml: 0.5,
                mb: 0.5,
                display: 'block'
              }}
            >
              {senderNickname}
            </Typography>
          )}
          
          <Paper
            elevation={2}
            sx={{
              p: 1.5,
              bgcolor: isOwn ? '#1976d2' : '#ffffff',
              color: isOwn ? '#ffffff' : '#000000',
              borderRadius: isOwn 
                ? '18px 18px 4px 18px' 
                : '18px 18px 18px 4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }
            }}
          >
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
              {message.content}
            </Typography>
          </Paper>
          
          {isOwn && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                textAlign: 'right',
                mt: 0.5,
                color: 'text.secondary',
                fontSize: '0.7rem'
              }}
            >
              {new Date(message.sent_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          )}
        </Box>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'row' }}>
      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <AppBar position="static" sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <Toolbar sx={{ minHeight: '64px !important' }}>
            <Avatar sx={{ 
              mr: 2, 
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              width: 40,
              height: 40,
              fontSize: '1.1rem'
            }}>
              GL
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                General Lounge
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
              </Typography>
            </Box>
            
            <Chip 
              label={isConnected ? 'Connected' : 'Disconnected'} 
              size="small" 
              color={isConnected ? 'success' : 'error'}
              sx={{ mr: 2, color: 'white' }}
            />
            
            <IconButton 
              color="inherit" 
              onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={onlineUsers.length} color="secondary">
                <People />
              </Badge>
            </IconButton>
            
            <Button color="inherit" onClick={handleLeaveChat} startIcon={<ExitToApp />}>
              Leave
            </Button>
            <Button color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          bgcolor: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
          position: 'relative'
        }}>
          <List sx={{ pb: 0 }}>
            {roomMessages.map((message, index) => renderMessage(message, index))}
          </List>
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <Fade in={true}>
              <Box sx={{ px: 2, py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {getUserNickname(typingUsers[0])[0]}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {typingUsers.length === 1 
                      ? `${getUserNickname(typingUsers[0])} is typing...`
                      : `${typingUsers.length} users are typing...`
                    }
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[0, 1, 2].map(i => (
                      <Circle 
                        key={i}
                        sx={{ 
                          fontSize: 8,
                          color: 'text.secondary',
                          animation: 'pulse 1.5s ease-in-out infinite',
                          animationDelay: `${i * 0.15}s`,
                          '@keyframes pulse': {
                            '0%, 70%, 100%': { opacity: 0.4 },
                            '35%': { opacity: 1 }
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

        {/* Input Area */}
        <Paper elevation={8} sx={{ 
          p: 2, 
          bgcolor: 'white',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
              multiline
              maxRows={4}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '25px',
                  bgcolor: '#f8f9fa',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#f1f3f4',
                  },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
                  }
                },
                '& .MuiOutlinedInput-input': {
                  color: '#000000',
                  '&::placeholder': {
                    color: '#666666',
                    opacity: 1,
                  },
                }
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              sx={{
                bgcolor: newMessage.trim() && isConnected ? 'primary.main' : 'grey.400',
                color: 'white',
                width: 48,
                height: 48,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: newMessage.trim() && isConnected ? 'primary.dark' : 'grey.500',
                  transform: isConnected ? 'scale(1.05)' : 'none'
                },
                '&:disabled': {
                  bgcolor: 'grey.400',
                  color: 'grey.600'
                }
              }}
            >
              <Send />
            </IconButton>
          </Box>
        </Paper>
      </Box>

      {/* Online Users Sidebar */}
      <Slide direction="left" in={showOnlineUsers} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            width: 300,
            height: '100vh',
            bgcolor: 'background.paper',
            borderLeft: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Sidebar Header */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People />
              <Typography variant="h6">
                Online Users ({onlineUsers.length})
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setShowOnlineUsers(false)}
            >
              <Close />
            </IconButton>
          </Box>
          
          {/* Users List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List dense>
              {onlineUsers.map((onlineUser) => (
                <ListItemButton key={onlineUser.id}>
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            bgcolor: 'success.main',
                            borderRadius: '50%',
                            border: '2px solid white',
                          }}
                        />
                      }
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: generateUserColor(onlineUser.id),
                          width: 40,
                          height: 40
                        }}
                      >
                        {onlineUser.avatar}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight="medium">
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
                          Online
                        </Typography>
                      )
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
          
          {/* Sidebar Footer */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.default', 
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center'
          }}>
            <Typography variant="caption" color="text.secondary">
              Real-time chat • {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Paper>
      </Slide>
    </Box>
  );
};

export default EnhancedChatInterface;