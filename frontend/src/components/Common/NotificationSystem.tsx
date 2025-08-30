import React, { useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, Box, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { removeNotification } from '../../store/slices/uiSlice';

const NotificationSystem: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.ui);

  // Auto-remove notifications based on timeout
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};

    notifications.forEach((notification) => {
      if (notification.timeout && !notification.persistent && !timers[notification.id]) {
        timers[notification.id] = setTimeout(() => {
          dispatch(removeNotification(notification.id));
          delete timers[notification.id];
        }, notification.timeout);
      }
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [notifications, dispatch]);

  const handleClose = (notificationId: string) => {
    dispatch(removeNotification(notificationId));
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
        width: '100%',
      }}
    >
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          sx={{
            position: 'static',
            mb: index < notifications.length - 1 ? 1 : 0,
          }}
        >
          <Alert
            severity={notification.type}
            variant="filled"
            action={
              <IconButton
                size="small"
                color="inherit"
                onClick={() => handleClose(notification.id)}
              >
                <Close fontSize="small" />
              </IconButton>
            }
            sx={{ width: '100%' }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

export default NotificationSystem;