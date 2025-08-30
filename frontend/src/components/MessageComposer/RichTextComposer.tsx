import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Divider,
  ButtonGroup,
  InputAdornment,
  Popover,
  Grid
} from '@mui/material';
import {
  Send,
  FormatBold,
  FormatItalic,
  Code,
  FormatQuote,
  Link,
  EmojiEmotions,
  Gif,
  Schedule,
  Edit,
  Delete,
  Reply,
  ContentCopy,
  MoreVert
} from '@mui/icons-material';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface RichTextComposerProps {
  onSendMessage: (content: string, formatting?: MessageFormatting) => void;
  onEditMessage?: (messageId: string, content: string, formatting?: MessageFormatting) => void;
  onDeleteMessage?: (messageId: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
  editingMessage?: {
    id: string;
    content: string;
    formatting?: MessageFormatting;
  } | null;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export interface MessageFormatting {
  bold?: Array<{ start: number; end: number }>;
  italic?: Array<{ start: number; end: number }>;
  code?: Array<{ start: number; end: number }>;
  codeBlock?: Array<{ start: number; end: number; language?: string }>;
  quote?: Array<{ start: number; end: number }>;
  link?: Array<{ start: number; end: number; url: string }>;
  image?: Array<{ start: number; end: number; url: string; alt: string }>;
  mention?: Array<{ start: number; end: number; userId: string; username: string }>;
}

interface MessageDraft {
  content: string;
  formatting?: MessageFormatting;
  timestamp: number;
}

const EMOJI_SHORTCUTS = {
  ':)': '😊',
  ':D': '😃',
  ':P': '😛',
  ':(': '😞',
  ':o': '😮',
  '<3': '❤️',
  '</3': '💔',
  ':thumbsup:': '👍',
  ':thumbsdown:': '👎',
  ':fire:': '🔥',
  ':100:': '💯'
};

const RichTextComposer: React.FC<RichTextComposerProps> = ({
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onStartTyping,
  onStopTyping,
  replyTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 2000
}) => {
  const [message, setMessage] = useState(editingMessage?.content || '');
  const [formatting, setFormatting] = useState<MessageFormatting>(editingMessage?.formatting || {});
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [draft, setDraft] = useState<MessageDraft | null>(null);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  
  const textFieldRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const scheduleButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-save draft every 2 seconds
  useEffect(() => {
    if (message.trim() && !editingMessage) {
      const timer = setTimeout(() => {
        setDraft({
          content: message,
          formatting,
          timestamp: Date.now()
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message, formatting, editingMessage]);

  // Load draft on mount
  useEffect(() => {
    if (!editingMessage && draft) {
      setMessage(draft.content);
      setFormatting(draft.formatting || {});
    }
  }, []);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    onStartTyping?.();
    if (typingTimer) clearTimeout(typingTimer);
    const timer = setTimeout(() => {
      onStopTyping?.();
    }, 3000);
    setTypingTimer(timer);
  }, [onStartTyping, onStopTyping, typingTimer]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (newValue.length <= maxLength) {
      setMessage(newValue);
      
      // Process emoji shortcuts
      const processedValue = processEmojiShortcuts(newValue);
      if (processedValue !== newValue) {
        setMessage(processedValue);
      }
      
      handleTypingStart();
    }
  };

  const processEmojiShortcuts = (text: string): string => {
    let processed = text;
    Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
      const regex = new RegExp(shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processed = processed.replace(regex, emoji);
    });
    return processed;
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'b':
          event.preventDefault();
          toggleFormatting('bold');
          break;
        case 'i':
          event.preventDefault();
          toggleFormatting('italic');
          break;
        case 'k':
          event.preventDefault();
          // TODO: Open link dialog
          break;
        case 'Enter':
          event.preventDefault();
          handleSend();
          break;
      }
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleFormatting = (type: keyof MessageFormatting) => {
    if (textFieldRef.current) {
      const start = textFieldRef.current.selectionStart || 0;
      const end = textFieldRef.current.selectionEnd || 0;
      
      if (start !== end) {
        setFormatting(prev => ({
          ...prev,
          [type]: [...(prev[type] || []), { start, end }]
        }));
      }
    }
  };

  const addFormatting = (type: keyof MessageFormatting, data?: any) => {
    if (textFieldRef.current) {
      const start = textFieldRef.current.selectionStart || 0;
      const end = textFieldRef.current.selectionEnd || 0;
      
      if (start !== end) {
        const formatData: any = { start, end, ...data };
        setFormatting(prev => ({
          ...prev,
          [type]: [...(prev[type] || []), formatData]
        }));
      }
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    if (textFieldRef.current) {
      const start = textFieldRef.current.selectionStart || 0;
      const newMessage = message.slice(0, start) + emoji + message.slice(start);
      setMessage(newMessage);
      
      // Focus back to input
      setTimeout(() => {
        if (textFieldRef.current) {
          textFieldRef.current.focus();
          textFieldRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
        }
      }, 10);
    }
    setShowEmojiPicker(false);
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      if (editingMessage) {
        // Handle message editing
        onEditMessage?.(editingMessage.id, message.trim(), formatting);
        onCancelEdit?.();
      } else {
        // Handle new message
        onSendMessage(message.trim(), formatting);
      }
      
      setMessage('');
      setFormatting({});
      setDraft(null);
      
      if (typingTimer) {
        clearTimeout(typingTimer);
        onStopTyping?.();
      }
    }
  };

  const handleScheduleSend = (delay: number) => {
    if (!message.trim()) return;
    
    const scheduleTime = new Date(Date.now() + delay * 60 * 1000);
    
    // For now, just send immediately with a note
    // In real implementation, this would use a job queue
    const scheduledMessage = `[Scheduled for ${scheduleTime.toLocaleTimeString()}] ${message}`;
    onSendMessage(scheduledMessage.trim(), formatting);
    setMessage('');
    setFormatting({});
    setDraft(null);
    setShowScheduleMenu(false);
    
    if (typingTimer) {
      clearTimeout(typingTimer);
      onStopTyping?.();
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    // Insert GIF as a link in the message
    const gifText = `![GIF](${gifUrl})`;
    if (textFieldRef.current) {
      const start = textFieldRef.current.selectionStart || 0;
      const newMessage = message.slice(0, start) + gifText + message.slice(start);
      setMessage(newMessage);
      
      // Focus back to input
      setTimeout(() => {
        if (textFieldRef.current) {
          textFieldRef.current.focus();
          textFieldRef.current.setSelectionRange(start + gifText.length, start + gifText.length);
        }
      }, 10);
    }
    setShowGifPicker(false);
  };

  const getFormattedPreview = () => {
    let preview = message;
    
    // Apply formatting for preview (simplified)
    if (formatting.bold) {
      formatting.bold.forEach(({ start, end }) => {
        const before = preview.slice(0, start);
        const formatted = preview.slice(start, end);
        const after = preview.slice(end);
        preview = before + `**${formatted}**` + after;
      });
    }
    
    return preview;
  };

  const renderReplyContext = () => {
    if (!replyTo) return null;
    
    return (
      <Box sx={{ 
        p: 1, 
        backgroundColor: 'grey.100', 
        borderLeft: '4px solid primary.main',
        mb: 1,
        borderRadius: '4px 4px 0 0'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Replying to {replyTo.sender}
          </Typography>
          <IconButton size="small" onClick={onCancelReply}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
          {replyTo.content.slice(0, 100)}{replyTo.content.length > 100 ? '...' : ''}
        </Typography>
      </Box>
    );
  };

  const renderEditContext = () => {
    if (!editingMessage) return null;
    
    return (
      <Box sx={{ 
        p: 1, 
        backgroundColor: 'warning.light', 
        borderLeft: '4px solid warning.main',
        mb: 1,
        borderRadius: '4px 4px 0 0'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            <Edit fontSize="small" sx={{ mr: 0.5 }} />
            Editing message
          </Typography>
          <IconButton size="small" onClick={onCancelEdit}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    );
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: 3, 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid rgba(0,0,0,0.08)'
      }}
    >
      {renderReplyContext()}
      {renderEditContext()}
      
      <Box sx={{ p: 2 }}>
        {/* Formatting Toolbar */}
        <Box sx={{ 
          mb: 2, 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          p: 1,
          bgcolor: 'rgba(0,0,0,0.03)',
          borderRadius: 2
        }}>
          <ButtonGroup 
            size="small" 
            variant="outlined"
            sx={{
              '& .MuiButtonGroup-grouped': {
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'white'
                }
              }
            }}
          >
            <Tooltip title="Bold (Ctrl+B)" arrow>
              <IconButton 
                onClick={() => toggleFormatting('bold')}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <FormatBold fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic (Ctrl+I)" arrow>
              <IconButton 
                onClick={() => toggleFormatting('italic')}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <FormatItalic fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code" arrow>
              <IconButton 
                onClick={() => toggleFormatting('code')}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <Code fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Quote" arrow>
              <IconButton 
                onClick={() => toggleFormatting('quote')}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <FormatQuote fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Link (Ctrl+K)" arrow>
              <IconButton 
                onClick={() => addFormatting('link', { url: 'https://' })}
                sx={{ 
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <Link fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <Tooltip title="Emoji" arrow>
            <IconButton 
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              sx={{ 
                color: showEmojiPicker ? 'primary.main' : 'inherit',
                bgcolor: showEmojiPicker ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  bgcolor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              <EmojiEmotions fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="GIF" arrow>
            <IconButton 
              ref={gifButtonRef}
              onClick={() => setShowGifPicker(!showGifPicker)}
              sx={{ 
                color: showGifPicker ? 'primary.main' : 'inherit',
                bgcolor: showGifPicker ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  bgcolor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              <Gif fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Schedule Message" arrow>
            <IconButton 
              ref={scheduleButtonRef}
              onClick={() => setShowScheduleMenu(!showScheduleMenu)}
              sx={{ 
                color: showScheduleMenu ? 'primary.main' : 'inherit',
                bgcolor: showScheduleMenu ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  bgcolor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              <Schedule fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Message Input */}
        <TextField
          inputRef={textFieldRef}
          fullWidth
          multiline
          maxRows={6}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.8)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.95)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.light'
                }
              },
              '&.Mui-focused': {
                bgcolor: 'white',
                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 2
                }
              }
            },
            '& .MuiInputBase-input': {
              fontSize: '1rem',
              lineHeight: 1.5
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ alignItems: 'flex-end', pb: 0.5 }}>
                <Tooltip title={`Send ${editingMessage ? 'Edit' : 'Message'} (Ctrl+Enter)`} arrow>
                  <IconButton 
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                    color="primary"
                    sx={{
                      bgcolor: message.trim() ? 'primary.main' : 'rgba(0,0,0,0.1)',
                      color: message.trim() ? 'white' : 'rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: message.trim() ? 'primary.dark' : 'rgba(0,0,0,0.15)',
                        transform: message.trim() ? 'scale(1.05)' : 'none'
                      },
                      '&:disabled': {
                        bgcolor: 'rgba(0,0,0,0.05)',
                        color: 'rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Send fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }}
          helperText={
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {draft && (
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    💾 Draft saved {new Date(draft.timestamp).toLocaleTimeString()}
                  </Box>
                )}
              </Typography>
              <Typography 
                variant="caption" 
                color={message.length > maxLength * 0.9 ? 'warning.main' : 'text.secondary'}
                sx={{ fontWeight: message.length > maxLength * 0.9 ? 600 : 400 }}
              >
                {message.length}/{maxLength}
              </Typography>
            </Box>
          }
        />

        {/* Formatting Preview */}
        {Object.keys(formatting).length > 0 && (
          <Box sx={{ 
            mt: 1, 
            p: 2, 
            bgcolor: 'rgba(25, 118, 210, 0.04)', 
            borderRadius: 2,
            border: '1px solid rgba(25, 118, 210, 0.12)'
          }}>
            <Typography 
              variant="caption" 
              color="primary.main" 
              sx={{ 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 1
              }}
            >
              👁️ Preview:
            </Typography>
            <Typography 
              variant="body2" 
              component="div"
              sx={{ 
                '& code': {
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  borderRadius: '3px',
                  padding: '2px 4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                },
                '& strong': {
                  fontWeight: 700
                },
                '& em': {
                  fontStyle: 'italic'
                },
                '& blockquote': {
                  borderLeft: '3px solid #ccc',
                  paddingLeft: '12px',
                  margin: '4px 0',
                  color: '#666',
                  fontStyle: 'italic'
                }
              }}
              dangerouslySetInnerHTML={{
                __html: getFormattedPreview()
              }}
            />
          </Box>
        )}
      </Box>

      {/* Emoji Picker Popover */}
      <Popover
        open={showEmojiPicker}
        anchorEl={emojiButtonRef.current}
        onClose={() => setShowEmojiPicker(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      </Popover>

      {/* GIF Picker Popover */}
      <Popover
        open={showGifPicker}
        anchorEl={gifButtonRef.current}
        onClose={() => setShowGifPicker(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, width: 300, maxHeight: 400 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search GIFs..."
            value={gifSearchQuery}
            onChange={(e) => setGifSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={1}>
            {/* Sample GIFs - In real implementation, integrate with GIPHY API */}
            {[
              'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
              'https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif',
              'https://media.giphy.com/media/l4q8cJzGdR9J8w3hS/giphy.gif',
              'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif'
            ].map((gifUrl, index) => (
              <Grid item xs={6} key={index}>
                <Box
                  component="img"
                  src={gifUrl}
                  onClick={() => handleGifSelect(gifUrl)}
                  sx={{
                    width: '100%',
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                      border: '2px solid primary.main'
                    }
                  }}
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Click a GIF to insert into your message
          </Typography>
        </Box>
      </Popover>

      {/* Schedule Menu */}
      <Menu
        open={showScheduleMenu}
        anchorEl={scheduleButtonRef.current}
        onClose={() => setShowScheduleMenu(false)}
      >
        <MenuItem onClick={() => handleScheduleSend(5)}>In 5 minutes</MenuItem>
        <MenuItem onClick={() => handleScheduleSend(30)}>In 30 minutes</MenuItem>
        <MenuItem onClick={() => handleScheduleSend(60)}>In 1 hour</MenuItem>
        <MenuItem onClick={() => handleScheduleSend(1440)}>Tomorrow</MenuItem>
      </Menu>
    </Paper>
  );
};

export default RichTextComposer;