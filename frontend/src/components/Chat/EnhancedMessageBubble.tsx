import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Fade,
  Tooltip,
  Chip,
  Avatar,
  Paper
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Reply,
  Check,
  DoneAll,
  ContentCopy,
  EmojiEmotions
} from '@mui/icons-material';
import { MessageFormatting } from '../MessageComposer/RichTextComposer';
import { renderFormattedMessage } from '../../utils/messageFormatting';

interface MessageWithMetadata {
  id: string;
  room_id: string;
  sender_id: string;
  sender_nickname?: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'emoji' | 'url' | 'audio' | 'whisper' | 'deleted';
  formatting?: MessageFormatting;
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

interface EnhancedMessageBubbleProps {
  message: MessageWithMetadata;
  isOwn: boolean;
  isSystem: boolean;
  showName: boolean;
  showDate: boolean;
  isLastInGroup: boolean;
  senderName: string;
  senderColor: string;
  currentUserId: string;
  isMobile: boolean;
  onEdit?: (message: MessageWithMetadata) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: MessageWithMetadata) => void;
  onCopy?: (content: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isOwn,
  isSystem,
  showName,
  showDate,
  isLastInGroup,
  senderName,
  senderColor,
  currentUserId,
  isMobile,
  onEdit,
  onDelete,
  onReply,
  onCopy,
  onReaction
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [showReactions, setShowReactions] = useState(false);

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

  const handleCopyMessage = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
    setMenuAnchorEl(null);
  };

  const handleEdit = () => {
    if (onEdit && message.message_type !== 'deleted') {
      onEdit(message);
    }
    setMenuAnchorEl(null);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
    setMenuAnchorEl(null);
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
    setMenuAnchorEl(null);
  };

  const handleReaction = (emoji: string) => {
    if (onReaction) {
      onReaction(message.id, emoji);
    }
    setShowReactions(false);
  };

  const isWhisper = message.is_whisper;
  const isWhisperFromMe = isWhisper && message.sender_id === currentUserId;
  const isDeleted = message.message_type === 'deleted';

  // System message rendering
  if (isSystem) {
    return (
      <Box key={message.id}>
        {showDate && (
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Chip
              label={formatDate(message.sent_at)}
              size="small"
              sx={{
                bgcolor: '#e1f5fe',
                color: '#0277bd',
                fontWeight: 500,
                fontSize: '0.75rem'
              }}
            />
          </Box>
        )}
        <Box sx={{ textAlign: 'center', my: 1 }}>
          <Chip
            label={message.content}
            size="small"
            sx={{
              bgcolor: 'rgba(0,0,0,0.05)',
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box key={message.id}>
      {showDate && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Chip
            label={formatDate(message.sent_at)}
            size="small"
            sx={{
              bgcolor: '#e1f5fe',
              color: '#0277bd',
              fontWeight: 500,
              fontSize: '0.75rem'
            }}
          />
        </Box>
      )}
      
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: isLastInGroup ? 1 : 0.25,
          px: isMobile ? 1 : 2,
        }}
      >
        {/* Avatar for non-own messages */}
        {!isOwn && !isSystem && showName && (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              mr: 1,
              bgcolor: senderColor,
              fontSize: '0.8rem',
              alignSelf: 'flex-end'
            }}
          >
            {senderName[0]?.toUpperCase()}
          </Avatar>
        )}
        
        <Box
          sx={{
            maxWidth: isMobile ? '85%' : '70%',
            position: 'relative',
          }}
        >
          {showName && !isOwn && (
            <Typography
              variant="caption"
              sx={{
                color: senderColor,
                fontWeight: 600,
                ml: 1,
                mb: 0.5,
                display: 'block',
                fontSize: '0.75rem'
              }}
            >
              {senderName}
            </Typography>
          )}
          
          <Paper
            elevation={1}
            sx={{
              bgcolor: isWhisper 
                ? (isOwn ? '#fff3cd' : '#f8d7da')
                : isDeleted
                  ? '#f5f5f5'
                  : (isOwn ? '#dcf8c6' : 'white'),
              p: 1.5,
              borderRadius: isOwn 
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: isWhisper ? '1px solid rgba(255,193,7,0.3)' : 'none',
              position: 'relative',
              wordBreak: 'break-word',
              transition: 'all 0.2s ease',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '& .message-actions': {
                  opacity: 1
                }
              }
            }}
          >
            {/* Whisper indicator */}
            {isWhisper && (
              <Typography
                variant="caption"
                sx={{
                  color: '#ffc107',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 0.5,
                  gap: 0.5
                }}
              >
                🤫 Whisper {isWhisperFromMe ? `to ${message.whisper_to_nickname}` : `from ${senderName}`}
              </Typography>
            )}

            {/* Edit indicator */}
            {message.is_edited && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  display: 'block',
                  mb: 0.5,
                  fontStyle: 'italic'
                }}
              >
                edited {message.edited_at ? `at ${formatTime(message.edited_at)}` : ''}
              </Typography>
            )}
            
            {/* Message content */}
            <Typography
              variant="body2"
              component="div"
              sx={{
                color: isDeleted ? '#888' : '#303030',
                lineHeight: 1.4,
                pr: isOwn ? 6 : 0,
                fontStyle: isDeleted ? 'italic' : 'normal',
                '& code': {
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  borderRadius: '3px',
                  padding: '2px 4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                },
                '& pre': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  overflow: 'auto',
                  margin: '8px 0',
                  '& code': {
                    backgroundColor: 'transparent',
                    padding: 0
                  }
                },
                '& blockquote': {
                  borderLeft: '4px solid #ccc',
                  paddingLeft: '12px',
                  margin: '8px 0',
                  color: '#666',
                  fontStyle: 'italic'
                },
                '& a': {
                  color: '#1976d2',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                },
                '& .mention': {
                  backgroundColor: 'rgba(25,118,210,0.1)',
                  color: '#1976d2',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontWeight: 500
                }
              }}
              dangerouslySetInnerHTML={{
                __html: isDeleted 
                  ? '<em>This message was deleted</em>'
                  : (message.formatting 
                    ? renderFormattedMessage(message.content, message.formatting)
                    : message.content.replace(/\n/g, '<br/>'))
              }}
            />

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {message.reactions.map((reaction, index) => (
                  <Chip
                    key={index}
                    size="small"
                    label={`${reaction.emoji} ${reaction.count || 1}`}
                    onClick={() => handleReaction(reaction.emoji)}
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      bgcolor: 'rgba(0,0,0,0.05)',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.1)'
                      }
                    }}
                  />
                ))}
              </Box>
            )}
            
            {/* Message timestamp and status */}
            {isOwn && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 4,
                  right: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    lineHeight: 1,
                  }}
                >
                  {formatTime(message.sent_at)}
                </Typography>
                {message.status === 'sent' && (
                  <Check sx={{ fontSize: 16, color: '#666' }} />
                )}
                {message.status === 'delivered' && (
                  <DoneAll sx={{ fontSize: 16, color: '#666' }} />
                )}
                {message.status === 'read' && (
                  <DoneAll sx={{ fontSize: 16, color: '#4fc3f7' }} />
                )}
              </Box>
            )}

            {!isOwn && (
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 4,
                  left: 8,
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                }}
              >
                {formatTime(message.sent_at)}
              </Typography>
            )}
            
            {/* Message actions menu */}
            <Box
              className="message-actions"
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                opacity: 0,
                transition: 'opacity 0.2s ease',
                display: 'flex',
                gap: 0.5
              }}
            >
              {/* Quick reaction button */}
              <Tooltip title="Add reaction">
                <IconButton
                  size="small"
                  onClick={() => setShowReactions(!showReactions)}
                  sx={{ 
                    color: 'rgba(0,0,0,0.6)',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                  }}
                >
                  <EmojiEmotions fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* More actions menu */}
              <Tooltip title="More actions">
                <IconButton
                  size="small"
                  onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                  sx={{ 
                    color: 'rgba(0,0,0,0.6)',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Quick reactions overlay */}
            {showReactions && (
              <Fade in={showReactions}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: -50,
                    right: 0,
                    bgcolor: 'white',
                    borderRadius: '25px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    p: 1,
                    display: 'flex',
                    gap: 0.5,
                    zIndex: 10
                  }}
                >
                  {['👍', '❤️', '😂', '😮', '😢', '😠'].map((emoji) => (
                    <IconButton
                      key={emoji}
                      size="small"
                      onClick={() => handleReaction(emoji)}
                      sx={{
                        fontSize: '1.2rem',
                        '&:hover': {
                          transform: 'scale(1.3)',
                          transition: 'transform 0.1s ease'
                        }
                      }}
                    >
                      {emoji}
                    </IconButton>
                  ))}
                </Box>
              </Fade>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            borderRadius: 2
          }
        }}
      >
        {!isDeleted && (
          <MenuItem onClick={handleReply}>
            <Reply sx={{ mr: 2, fontSize: 20 }} />
            Reply
          </MenuItem>
        )}
        
        <MenuItem onClick={handleCopyMessage}>
          <ContentCopy sx={{ mr: 2, fontSize: 20 }} />
          Copy text
        </MenuItem>
        
        {isOwn && !isDeleted && (
          <>
            <MenuItem onClick={handleEdit}>
              <Edit sx={{ mr: 2, fontSize: 20 }} />
              Edit
            </MenuItem>
            
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Delete sx={{ mr: 2, fontSize: 20 }} />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default EnhancedMessageBubble;