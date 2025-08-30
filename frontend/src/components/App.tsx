import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { store } from '../store/store';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { initializeAuth } from '../store/slices/authSlice';
import { initializeUI, setDeviceType } from '../store/slices/uiSlice';

// Components
import LandingPage from './Landing/LandingPage';
import RoomsPage from './Rooms/RoomsPage';
import RegisterScreen from './Auth/RegisterScreen';
import WhatsAppStyleChat from './Chat/WhatsAppStyleChat';
import NotificationSystem from './Common/NotificationSystem';
import ConnectionStatus from './Common/ConnectionStatus';
import PrivacyProtection from './Common/PrivacyProtection';

// Create MUI theme
const createAppTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#6366f1' : '#4f46e5',
      },
      secondary: {
        main: mode === 'dark' ? '#ec4899' : '#db2777',
      },
      background: {
        default: mode === 'dark' ? '#111827' : '#f9fafb',
        paper: mode === 'dark' ? '#1f2937' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: mode === 'dark' ? '#374151' : '#e5e7eb',
            },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'dark' ? '#6b7280' : '#9ca3af',
              borderRadius: '4px',
            },
          },
        },
      },
    },
  });

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.ui);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Determine theme mode
  const themeMode = React.useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  const appTheme = React.useMemo(() => createAppTheme(themeMode), [themeMode]);

  // Initialize app on mount
  useEffect(() => {
    dispatch(initializeAuth());
    dispatch(initializeUI());

    // Set up responsive breakpoints
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
      dispatch(setDeviceType({ isMobile, isTablet }));
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      // Force re-render when system theme changes
      if (theme === 'auto') {
        // Trigger a re-render
        dispatch(setDeviceType({ 
          isMobile: window.innerWidth <= 768, 
          isTablet: window.innerWidth > 768 && window.innerWidth <= 1024 
        }));
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [dispatch, theme]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <PrivacyProtection />
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/chat/:roomId" element={<WhatsAppStyleChat />} />
      </Routes>

      {/* Global UI Components */}
      <NotificationSystem />
      <ConnectionStatus />
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;
