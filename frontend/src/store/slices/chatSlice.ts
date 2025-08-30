import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message, ChatRoom, User, TypingIndicator } from '../../types/chat';

interface ChatState {
  currentRoom: ChatRoom | null;
  messages: Record<string, Message[]>;
  rooms: Record<string, ChatRoom>;
  partner: User | null;
  typingUsers: Record<string, string[]>; // roomId -> userIds
  isConnected: boolean;
  connectionError: string | null;
}

const initialState: ChatState = {
  currentRoom: null,
  messages: {},
  rooms: {},
  partner: null,
  typingUsers: {},
  isConnected: false,
  connectionError: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Connection management
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.connectionError = null;
      }
    },
    setConnectionError: (state, action: PayloadAction<string | null>) => {
      state.connectionError = action.payload;
    },

    // Room management
    setCurrentRoom: (state, action: PayloadAction<ChatRoom | null>) => {
      state.currentRoom = action.payload;
    },
    addRoom: (state, action: PayloadAction<ChatRoom>) => {
      const room = action.payload;
      state.rooms[room.id] = room;
    },
    updateRoom: (state, action: PayloadAction<Partial<ChatRoom> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      if (state.rooms[id]) {
        state.rooms[id] = { ...state.rooms[id], ...updates };
      }
      if (state.currentRoom?.id === id) {
        state.currentRoom = { ...state.currentRoom, ...updates };
      }
    },
    removeRoom: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      delete state.rooms[roomId];
      if (state.currentRoom?.id === roomId) {
        state.currentRoom = null;
      }
    },

    // Message management
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const roomId = message.room_id;
      
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      // Avoid duplicates
      const exists = state.messages[roomId].some(m => m.id === message.id);
      if (!exists) {
        state.messages[roomId].push(message);
        // Sort by timestamp
        state.messages[roomId].sort((a, b) => 
          new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        );
      }
    },
    setMessages: (state, action: PayloadAction<{ roomId: string; messages: Message[] }>) => {
      const { roomId, messages } = action.payload;
      state.messages[roomId] = messages.sort((a, b) => 
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      delete state.messages[roomId];
    },
    
    // Message editing
    editMessage: (state, action: PayloadAction<{
      roomId: string;
      messageId: string;
      content: string;
      formatting?: Record<string, any>;
    }>) => {
      const { roomId, messageId, content, formatting } = action.payload;
      const roomMessages = state.messages[roomId];
      
      if (roomMessages) {
        const messageIndex = roomMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          roomMessages[messageIndex] = {
            ...roomMessages[messageIndex],
            content,
            formatting,
            is_edited: true,
            edited_at: new Date().toISOString()
          };
        }
      }
    },
    
    // Message deletion
    deleteMessage: (state, action: PayloadAction<{
      roomId: string;
      messageId: string;
    }>) => {
      const { roomId, messageId } = action.payload;
      const roomMessages = state.messages[roomId];
      
      if (roomMessages) {
        const messageIndex = roomMessages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          // Soft delete - mark as deleted but keep in array for UI consistency
          roomMessages[messageIndex] = {
            ...roomMessages[messageIndex],
            content: '[Message deleted]',
            message_type: 'deleted',
            formatting: undefined,
            is_edited: true,
            edited_at: new Date().toISOString()
          };
        }
      }
    },

    // Partner management
    setPartner: (state, action: PayloadAction<User | null>) => {
      state.partner = action.payload;
    },

    // Typing indicators
    setTyping: (state, action: PayloadAction<TypingIndicator>) => {
      const { room_id, user_id, is_typing } = action.payload;
      
      if (!state.typingUsers[room_id]) {
        state.typingUsers[room_id] = [];
      }
      
      const currentTyping = state.typingUsers[room_id];
      
      if (is_typing) {
        if (!currentTyping.includes(user_id)) {
          currentTyping.push(user_id);
        }
      } else {
        const index = currentTyping.indexOf(user_id);
        if (index > -1) {
          currentTyping.splice(index, 1);
        }
      }
    },
    clearTyping: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      delete state.typingUsers[roomId];
    },

    // User events
    userJoined: (state, action: PayloadAction<{ room_id: string; user_id: string }>) => {
      const { room_id, user_id } = action.payload;
      const room = state.rooms[room_id] || state.currentRoom;
      
      if (room && room.id === room_id) {
        // Add system message
        const systemMessage: Message = {
          id: `system_${Date.now()}`,
          room_id: room_id,
          sender_id: 'system',
          content: 'User joined the chat',
          message_type: 'text',
          sent_at: new Date().toISOString(),
        };
        
        if (!state.messages[room_id]) {
          state.messages[room_id] = [];
        }
        state.messages[room_id].push(systemMessage);
      }
    },
    userLeft: (state, action: PayloadAction<{ room_id: string; user_id: string; reason?: string }>) => {
      const { room_id, user_id, reason } = action.payload;
      
      // Clear typing indicator
      if (state.typingUsers[room_id]) {
        const index = state.typingUsers[room_id].indexOf(user_id);
        if (index > -1) {
          state.typingUsers[room_id].splice(index, 1);
        }
      }
      
      // Add system message
      const systemMessage: Message = {
        id: `system_${Date.now()}`,
        room_id: room_id,
        sender_id: 'system',
        content: reason === 'partner_left' ? 'Your partner has left the chat' : 'User left the chat',
        message_type: 'text',
        sent_at: new Date().toISOString(),
      };
      
      if (!state.messages[room_id]) {
        state.messages[room_id] = [];
      }
      state.messages[room_id].push(systemMessage);

      // If partner left, clear partner
      if (state.partner?.id === user_id) {
        state.partner = null;
      }
    },

    // Reset chat state
    resetChat: (state) => {
      state.currentRoom = null;
      state.messages = {};
      state.rooms = {};
      state.partner = null;
      state.typingUsers = {};
    },

    // Clean expired messages
    cleanExpiredMessages: (state) => {
      const now = new Date();
      
      Object.keys(state.messages).forEach(roomId => {
        state.messages[roomId] = state.messages[roomId].filter(message => {
          if (!message.expires_at) return true;
          return new Date(message.expires_at) > now;
        });
      });
    },
  },
});

export const {
  setConnected,
  setConnectionError,
  setCurrentRoom,
  addRoom,
  updateRoom,
  removeRoom,
  addMessage,
  setMessages,
  clearMessages,
  editMessage,
  deleteMessage,
  setPartner,
  setTyping,
  clearTyping,
  userJoined,
  userLeft,
  resetChat,
  cleanExpiredMessages,
} = chatSlice.actions;

export default chatSlice.reducer;