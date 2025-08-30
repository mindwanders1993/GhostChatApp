import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
  List,
  ListItem,
  Avatar,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import { ExitToApp, MoreVert, Edit, Delete } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useSocket } from '../../hooks/useSocket';
import { logout } from '../../store/slices/authSlice';
import { addMessage, setConnected } from '../../store/slices/chatSlice';
import { showError, showSuccess } from '../../store/slices/uiSlice';
import { WebSocketMessage } from '../../types/chat';
import RichTextComposer, { MessageFormatting } from '../MessageComposer/RichTextComposer';
import { renderFormattedMessage } from '../../utils/messageFormatting';

const SimpleChatInterface: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);
  const { messages } = useAppSelector((state) => state.chat);

  const [isConnected, setIsConnected] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{id: string; content: string; formatting?: MessageFormatting} | null>(null);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  function handleWebSocketMessage(message: WebSocketMessage) {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'message_received':
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
        console.log('User joined:', message);
        break;
      case 'message_edited':
        // Handle message edit
        console.log('Message edited:', message);
        // TODO: Update message in Redux store
        break;
        
      case 'message_deleted':
        // Handle message deletion
        console.log('Message deleted:', message);
        // TODO: Remove message from Redux store or mark as deleted
        break;
      
      case 'error':
        dispatch(showError(message.message || 'An error occurred'));
        break;
    }
  }

  const { sendChatMessage, editMessage, deleteMessage, joinRoom, leaveRoom } = useSocket({
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
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      dispatch(showError(`Connection error: ${error.message}`));
    },
  });

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  const handleSendMessage = (content: string, formatting?: MessageFormatting) => {
    if (!content.trim() || !isConnected) return;

    console.log('Sending message:', content, formatting);
    sendChatMessage(currentRoomId, content.trim(), 'text', formatting);
  };

  const handleEditMessage = (messageId: string, content: string, formatting?: MessageFormatting) => {
    if (!content.trim() || !isConnected) return;

    console.log('Editing message:', messageId, content, formatting);
    editMessage(messageId, content, formatting);
    setEditingMessage(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!isConnected) return;

    console.log('Deleting message:', messageId);
    deleteMessage(messageId);
  };

  const startEditingMessage = (message: any) => {
    setEditingMessage({
      id: message.id,
      content: message.content,
      formatting: message.formatting
    });
  };

  const cancelEditing = () => {
    setEditingMessage(null);
  };

  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLElement>, message: any) => {
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMessage(null);
  };

  const handleEditFromMenu = () => {
    if (selectedMessage) {
      startEditingMessage(selectedMessage);
    }
    handleMessageMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedMessage) {
      handleDeleteMessage(selectedMessage.id);
    }
    handleMessageMenuClose();
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

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
            GL
          </Avatar>
          <Typography variant="h6" sx={{ flex: 1, color: 'white' }}>
            General Lounge
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, color: 'white' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
          <Button color="inherit" onClick={handleLeaveChat} startIcon={<ExitToApp />}>
            Leave
          </Button>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Messages Area */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        bgcolor: '#f5f5f5',
        p: 1
      }}>
        <List>
          {roomMessages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            
            return (
              <ListItem
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    bgcolor: isOwn ? '#1976d2' : '#ffffff',
                    color: isOwn ? '#ffffff' : '#000000',
                    borderRadius: 2,
                    position: 'relative',
                  }}
                >
                  {isOwn && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMessageMenuOpen(e, message)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'inherit',
                        opacity: 0.7,
                        '&:hover': { opacity: 1 }
                      }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  )}
                  
                  <Typography 
                    variant="body1" 
                    sx={{ wordBreak: 'break-word', pr: isOwn ? 3 : 0 }}
                    component="div"
                    dangerouslySetInnerHTML={{
                      __html: message.formatting 
                        ? renderFormattedMessage(message.content, message.formatting as MessageFormatting)
                        : message.content
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1,
                    opacity: 0.7,
                    color: 'inherit'
                  }}>
                    <span>{new Date(message.sent_at).toLocaleTimeString()}</span>
                    {message.is_edited && <span>(edited)</span>}
                  </Typography>
                </Paper>
              </ListItem>
            );
          })}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Action Menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
        PaperProps={{
          sx: { minWidth: 120 }
        }}
      >
        <MenuItem onClick={handleEditFromMenu}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Rich Text Input Area */}
      <Box sx={{ p: 1, bgcolor: '#f5f5f5' }}>
        <RichTextComposer
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          editingMessage={editingMessage}
          onCancelEdit={cancelEditing}
          placeholder="Type your message..."
          disabled={!isConnected}
          maxLength={2000}
        />
      </Box>
    </Box>
  );
};

export default SimpleChatInterface;