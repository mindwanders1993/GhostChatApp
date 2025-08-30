import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModerationWarning } from '../../types/chat';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timeout?: number;
  persistent?: boolean;
}

interface Dialog {
  id: string;
  type: 'confirm' | 'alert' | 'custom';
  title: string;
  message?: string;
  component?: string;
  data?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'auto';
  
  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  
  // Notifications
  notifications: Notification[];
  
  // Dialogs/Modals
  dialogs: Dialog[];
  
  // Sidebar/Navigation
  sidebarOpen: boolean;
  
  // Current view/page
  currentView: 'welcome' | 'register' | 'matching' | 'chat' | 'settings';
  
  // Moderation
  moderationWarnings: ModerationWarning[];
  showSafetyTips: boolean;
  
  // Chat UI
  chatSidebarOpen: boolean;
  emojiPickerOpen: boolean;
  
  // Mobile responsiveness
  isMobile: boolean;
  isTablet: boolean;
  
  // Connection status
  showConnectionStatus: boolean;
  
  // Sound settings
  soundEnabled: boolean;
  
  // Privacy mode
  screenShotBlocked: boolean;
}

const initialState: UIState = {
  theme: 'auto',
  isLoading: false,
  loadingMessage: '',
  notifications: [],
  dialogs: [],
  sidebarOpen: false,
  currentView: 'welcome',
  moderationWarnings: [],
  showSafetyTips: false,
  chatSidebarOpen: false,
  emojiPickerOpen: false,
  isMobile: false,
  isTablet: false,
  showConnectionStatus: false,
  soundEnabled: true,
  screenShotBlocked: true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    // Loading
    setLoading: (state, action: PayloadAction<{ loading: boolean; message?: string }>) => {
      state.isLoading = action.payload.loading;
      state.loadingMessage = action.payload.message || '';
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        id: Date.now().toString(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Dialogs
    addDialog: (state, action: PayloadAction<Omit<Dialog, 'id'>>) => {
      const dialog: Dialog = {
        id: Date.now().toString(),
        ...action.payload,
      };
      state.dialogs.push(dialog);
    },
    removeDialog: (state, action: PayloadAction<string>) => {
      state.dialogs = state.dialogs.filter(d => d.id !== action.payload);
    },
    clearDialogs: (state) => {
      state.dialogs = [];
    },
    
    // Sidebar
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    // Current view
    setCurrentView: (state, action: PayloadAction<UIState['currentView']>) => {
      state.currentView = action.payload;
    },
    
    // Moderation
    addModerationWarning: (state, action: PayloadAction<ModerationWarning>) => {
      state.moderationWarnings.push(action.payload);
      
      // Auto-show safety tips for severe warnings
      if (action.payload.type === 'violation' || action.payload.type === 'banned') {
        state.showSafetyTips = true;
      }
    },
    removeModerationWarning: (state, action: PayloadAction<number>) => {
      state.moderationWarnings.splice(action.payload, 1);
    },
    clearModerationWarnings: (state) => {
      state.moderationWarnings = [];
    },
    setShowSafetyTips: (state, action: PayloadAction<boolean>) => {
      state.showSafetyTips = action.payload;
    },
    
    // Chat UI
    setChatSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.chatSidebarOpen = action.payload;
    },
    toggleChatSidebar: (state) => {
      state.chatSidebarOpen = !state.chatSidebarOpen;
    },
    setEmojiPickerOpen: (state, action: PayloadAction<boolean>) => {
      state.emojiPickerOpen = action.payload;
    },
    toggleEmojiPicker: (state) => {
      state.emojiPickerOpen = !state.emojiPickerOpen;
    },
    
    // Mobile/responsive
    setDeviceType: (state, action: PayloadAction<{ isMobile: boolean; isTablet: boolean }>) => {
      state.isMobile = action.payload.isMobile;
      state.isTablet = action.payload.isTablet;
      
      // Auto-close sidebars on mobile
      if (action.payload.isMobile) {
        state.sidebarOpen = false;
        state.chatSidebarOpen = false;
      }
    },
    
    // Connection status
    setShowConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.showConnectionStatus = action.payload;
    },
    
    // Settings
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
      localStorage.setItem('soundEnabled', action.payload.toString());
    },
    setScreenShotBlocked: (state, action: PayloadAction<boolean>) => {
      state.screenShotBlocked = action.payload;
      localStorage.setItem('screenShotBlocked', action.payload.toString());
    },
    
    // Utility actions
    showSuccess: (state, action: PayloadAction<string>) => {
      state.notifications.push({
        id: Date.now().toString(),
        type: 'success',
        title: 'Success',
        message: action.payload,
        timeout: 3000,
      });
    },
    showError: (state, action: PayloadAction<string>) => {
      state.notifications.push({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: action.payload,
        timeout: 5000,
      });
    },
    showWarning: (state, action: PayloadAction<string>) => {
      state.notifications.push({
        id: Date.now().toString(),
        type: 'warning',
        title: 'Warning',
        message: action.payload,
        timeout: 4000,
      });
    },
    showInfo: (state, action: PayloadAction<string>) => {
      state.notifications.push({
        id: Date.now().toString(),
        type: 'info',
        title: 'Info',
        message: action.payload,
        timeout: 3000,
      });
    },
    
    // Initialize UI settings from localStorage
    initializeUI: (state) => {
      const theme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
      if (theme) {
        state.theme = theme;
      }
      
      const soundEnabled = localStorage.getItem('soundEnabled');
      if (soundEnabled !== null) {
        state.soundEnabled = soundEnabled === 'true';
      }
      
      const screenShotBlocked = localStorage.getItem('screenShotBlocked');
      if (screenShotBlocked !== null) {
        state.screenShotBlocked = screenShotBlocked === 'true';
      }
    },
    
    // Reset UI state
    resetUI: (state) => {
      state.notifications = [];
      state.dialogs = [];
      state.moderationWarnings = [];
      state.sidebarOpen = false;
      state.chatSidebarOpen = false;
      state.emojiPickerOpen = false;
      state.showSafetyTips = false;
      state.isLoading = false;
      state.loadingMessage = '';
      state.currentView = 'welcome';
    },
  },
});

export const {
  setTheme,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  addDialog,
  removeDialog,
  clearDialogs,
  setSidebarOpen,
  toggleSidebar,
  setCurrentView,
  addModerationWarning,
  removeModerationWarning,
  clearModerationWarnings,
  setShowSafetyTips,
  setChatSidebarOpen,
  toggleChatSidebar,
  setEmojiPickerOpen,
  toggleEmojiPicker,
  setDeviceType,
  setShowConnectionStatus,
  setSoundEnabled,
  setScreenShotBlocked,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  initializeUI,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;