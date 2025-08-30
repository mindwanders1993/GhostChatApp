import React from 'react';
import { Box, Chip, Collapse } from '@mui/material';
import { Wifi, WifiOff, Warning } from '@mui/icons-material';
import { useAppSelector } from '../../hooks/redux';

const ConnectionStatus: React.FC = () => {
  const { isConnected, connectionError } = useAppSelector((state) => state.chat);
  const { showConnectionStatus } = useAppSelector((state) => state.ui);

  const showStatus = showConnectionStatus || !isConnected || !!connectionError;

  return (
    <Collapse in={showStatus}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
        }}
      >
        {!isConnected ? (
          <Chip
            icon={<WifiOff />}
            label={connectionError || 'Disconnected'}
            color="error"
            variant="filled"
            sx={{ 
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'inherit' }
            }}
          />
        ) : connectionError ? (
          <Chip
            icon={<Warning />}
            label="Connection Issues"
            color="warning"
            variant="filled"
            sx={{ 
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'inherit' }
            }}
          />
        ) : (
          <Chip
            icon={<Wifi />}
            label="Connected"
            color="success"
            variant="filled"
            sx={{ 
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'inherit' }
            }}
          />
        )}
      </Box>
    </Collapse>
  );
};

export default ConnectionStatus;