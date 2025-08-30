/**
 * User Action Menu Component
 * 
 * Provides safety actions like blocking and reporting users
 * with clean UI and proper error handling.
 */

import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import {
  Block,
  Report,
  PersonOff,
  Flag,
  Warning,
  Close,
} from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/redux';
import { showError, showSuccess } from '../../store/slices/uiSlice';

interface UserActionMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  userId: string;
  userNickname?: string;
  messageId?: string;
  roomId?: string;
}

const UserActionMenu: React.FC<UserActionMenuProps> = ({
  anchorEl,
  open,
  onClose,
  userId,
  userNickname,
  messageId,
  roomId
}) => {
  const dispatch = useAppDispatch();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBlockUser = () => {
    onClose();
    setBlockDialogOpen(true);
  };

  const handleReportUser = () => {
    onClose();
    setReportDialogOpen(true);
  };

  const confirmBlock = async () => {
    if (!blockReason.trim()) {
      dispatch(showError('Please provide a reason for blocking'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/safety/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: userId,
          reason: blockReason.trim()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to block user');
      }

      dispatch(showSuccess(`User ${userNickname || 'User'} has been blocked`));
      setBlockDialogOpen(false);
      setBlockReason('');
      
    } catch (error: any) {
      dispatch(showError(error.message || 'Failed to block user'));
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReport = async () => {
    if (!reportType || !reportReason.trim()) {
      dispatch(showError('Please select a report type and provide a reason'));
      return;
    }

    setIsLoading(true);
    try {
      const reportData: any = {
        report_type: reportType,
        reason: reportReason.trim()
      };

      // Add appropriate IDs based on context
      if (messageId) {
        reportData.reported_message_id = messageId;
      }
      if (userId) {
        reportData.reported_user_id = userId;
      }
      if (roomId) {
        reportData.room_id = roomId;
      }

      const response = await fetch('/api/v1/safety/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit report');
      }

      dispatch(showSuccess('Report submitted successfully'));
      setReportDialogOpen(false);
      setReportType('');
      setReportReason('');
      
    } catch (error: any) {
      dispatch(showError(error.message || 'Failed to submit report'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleBlockUser}>
          <ListItemIcon>
            <Block fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText primary="Block User" />
        </MenuItem>
        
        <MenuItem onClick={handleReportUser}>
          <ListItemIcon>
            <Report fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Report User" />
        </MenuItem>
      </Menu>

      {/* Block User Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonOff color="warning" />
            Block User
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Blocking {userNickname || 'this user'} will hide their messages from you. 
            They will not be notified that you blocked them.
          </Alert>
          
          <TextField
            autoFocus
            label="Reason for blocking (required)"
            fullWidth
            multiline
            rows={3}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="e.g., Inappropriate behavior, harassment, spam..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmBlock} 
            variant="contained" 
            color="warning"
            disabled={isLoading || !blockReason.trim()}
          >
            {isLoading ? 'Blocking...' : 'Block User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report User Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Flag color="error" />
            Report {messageId ? 'Message' : 'User'}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Reports are reviewed by moderators to maintain community safety. 
            Please provide detailed information about the issue.
          </Alert>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              label="Report Type"
            >
              <MenuItem value="harassment">Harassment</MenuItem>
              <MenuItem value="spam">Spam</MenuItem>
              <MenuItem value="inappropriate">Inappropriate Content</MenuItem>
              <MenuItem value="threats">Threats or Violence</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Detailed reason (required)"
            fullWidth
            multiline
            rows={4}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Please describe the specific behavior or content you're reporting..."
          />
          
          {messageId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Reporting a specific message from {userNickname || 'this user'}
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmReport} 
            variant="contained" 
            color="error"
            disabled={isLoading || !reportType || !reportReason.trim()}
          >
            {isLoading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserActionMenu;