/**
 * Encryption Status Indicator Component
 * 
 * Shows users the encryption status of their chat session
 * with clear visual indicators for privacy awareness.
 */

import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Lock,
  LockOpen,
  Security,
  Warning,
  VerifiedUser,
} from '@mui/icons-material';

interface EncryptionIndicatorProps {
  encryptionStatus: {
    supported: boolean;
    enabled: boolean;
    reason?: string;
  };
  size?: 'small' | 'medium';
  variant?: 'chip' | 'icon' | 'full';
}

const EncryptionIndicator: React.FC<EncryptionIndicatorProps> = ({
  encryptionStatus,
  size = 'small',
  variant = 'chip'
}) => {
  const theme = useTheme();

  const getIndicatorProps = () => {
    if (encryptionStatus.supported && encryptionStatus.enabled) {
      return {
        icon: <Lock />,
        color: 'success' as const,
        label: 'End-to-End Encrypted',
        tooltip: 'Your messages are end-to-end encrypted and can only be read by participants in this conversation.',
        bgColor: theme.palette.success.main,
        textColor: 'white'
      };
    }
    
    if (encryptionStatus.supported && !encryptionStatus.enabled) {
      return {
        icon: <LockOpen />,
        color: 'warning' as const,
        label: 'Encryption Disabled',
        tooltip: 'End-to-end encryption is available but disabled. Enable it for better privacy.',
        bgColor: theme.palette.warning.main,
        textColor: 'white'
      };
    }
    
    return {
      icon: <Warning />,
      color: 'error' as const,
      label: 'Not Encrypted',
      tooltip: `End-to-end encryption is not available: ${encryptionStatus.reason}`,
      bgColor: theme.palette.error.main,
      textColor: 'white'
    };
  };

  const props = getIndicatorProps();

  if (variant === 'icon') {
    return (
      <Tooltip title={props.tooltip} arrow placement="top">
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: size === 'small' ? 24 : 32,
            height: size === 'small' ? 24 : 32,
            borderRadius: '50%',
            backgroundColor: props.bgColor,
            color: props.textColor,
            cursor: 'help',
          }}
        >
          {React.cloneElement(props.icon, { 
            fontSize: size === 'small' ? 'small' : 'medium' 
          })}
        </Box>
      </Tooltip>
    );
  }

  if (variant === 'chip') {
    return (
      <Tooltip title={props.tooltip} arrow placement="top">
        <Chip
          icon={props.icon}
          label={props.label}
          color={props.color}
          size={size}
          sx={{
            fontSize: size === 'small' ? '0.75rem' : '0.875rem',
            height: size === 'small' ? 24 : 32,
            cursor: 'help',
            '& .MuiChip-icon': {
              fontSize: size === 'small' ? '0.875rem' : '1rem'
            }
          }}
        />
      </Tooltip>
    );
  }

  // Full variant with detailed information
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: 1,
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${props.bgColor}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: props.bgColor,
          color: props.textColor,
        }}
      >
        {props.icon}
      </Box>
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {props.label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {props.tooltip}
        </Typography>
      </Box>
    </Box>
  );
};

export default EncryptionIndicator;

// Additional utility component for encryption status in app bar
export const EncryptionAppBarIndicator: React.FC<{
  encryptionStatus: EncryptionIndicatorProps['encryptionStatus'];
}> = ({ encryptionStatus }) => {
  const theme = useTheme();

  if (!encryptionStatus.supported) {
    return (
      <Tooltip title="End-to-end encryption not available on this device">
        <Warning sx={{ color: theme.palette.warning.main, fontSize: 18 }} />
      </Tooltip>
    );
  }

  if (encryptionStatus.enabled) {
    return (
      <Tooltip title="Messages are end-to-end encrypted">
        <VerifiedUser sx={{ color: theme.palette.success.main, fontSize: 18 }} />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="End-to-end encryption is disabled">
      <Security sx={{ color: theme.palette.grey[500], fontSize: 18 }} />
    </Tooltip>
  );
};