import { create } from 'zustand';
import { ChatState, GhostIdentity, Room, Message, AppStats, RoomMember } from '../types';

interface ChatStore extends ChatState {
  // Actions
  setGhost: (ghost: GhostIdentity) => void;
  setCurrentRoom: (roomId: string | undefined) => void;
  setRooms: (rooms: Room[]) => void;
  setPrivateRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  addPrivateRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;
  
  setMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearMessages: (roomId: string) => void;
  
  setConnectedUsers: (roomId: string, users: RoomMember[]) => void;
  addConnectedUser: (roomId: string, user: RoomMember) => void;
  removeConnectedUser: (roomId: string, userId: string) => void;
  
  setConnected: (connected: boolean) => void;
  setConnectionError: (error?: string) => void;
  
  setTypingUsers: (roomId: string, users: string[]) => void;
  addTypingUser: (roomId: string, userId: string) => void;
  removeTypingUser: (roomId: string, userId: string) => void;
  
  // Stats
  stats: AppStats;
  setStats: (stats: AppStats) => void;
  
  // Destruction
  destroy: () => void;
}

// Helper functions for persistence
const getStoredGhost = (): GhostIdentity | undefined => {
  try {
    const stored = sessionStorage.getItem('ghost-identity');
    const ghost = stored ? JSON.parse(stored) : undefined;
    console.log('Loading ghost from storage:', ghost);
    return ghost;
  } catch {
    console.log('Failed to load ghost from storage');
    return undefined;
  }
};

const storeGhost = (ghost: GhostIdentity | undefined) => {
  try {
    if (ghost) {
      console.log('Storing ghost to storage:', ghost);
      sessionStorage.setItem('ghost-identity', JSON.stringify(ghost));
    } else {
      console.log('Removing ghost from storage');
      sessionStorage.removeItem('ghost-identity');
    }
  } catch (error) {
    console.error('Failed to store ghost:', error);
  }
};

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state - load ghost from storage
  ghost: getStoredGhost(),
  currentRoom: undefined,
  rooms: [],
  privateRooms: [],
  messages: {},
  connectedUsers: {},
  isConnected: false,
  connectionError: undefined,
  typingUsers: {},
  stats: { active_ghosts: 0, total_rooms: 0 },

  // Ghost actions
  setGhost: (ghost) => {
    storeGhost(ghost);
    set({ ghost });
  },
  
  // Room actions
  setCurrentRoom: (roomId) => set({ currentRoom: roomId }),
  
  setRooms: (rooms) => set({ rooms }),
  
  setPrivateRooms: (privateRooms) => set({ privateRooms }),
  
  addRoom: (room) => set((state) => ({
    rooms: [...state.rooms.filter(r => r.id !== room.id), room]
  })),

  addPrivateRoom: (room) => set((state) => ({
    privateRooms: [...state.privateRooms.filter(r => r.id !== room.id), room]
  })),
  
  updateRoom: (roomId, updates) => set((state) => ({
    rooms: state.rooms.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    )
  })),
  
  removeRoom: (roomId) => set((state) => {
    const newMessages = { ...state.messages };
    delete newMessages[roomId];
    
    const newConnectedUsers = { ...state.connectedUsers };
    delete newConnectedUsers[roomId];
    
    const newTypingUsers = { ...state.typingUsers };
    delete newTypingUsers[roomId];
    
    return {
      rooms: state.rooms.filter(room => room.id !== roomId),
      messages: newMessages,
      connectedUsers: newConnectedUsers,
      typingUsers: newTypingUsers,
      currentRoom: state.currentRoom === roomId ? undefined : state.currentRoom
    };
  }),
  
  // Message actions
  setMessages: (roomId, messages) => set((state) => ({
    messages: { ...state.messages, [roomId]: messages }
  })),
  
  addMessage: (message) => set((state) => {
    const roomMessages = state.messages[message.room_id] || [];
    const messageExists = roomMessages.some(m => m.id === message.id);
    
    if (messageExists) return state;
    
    const newMessages = [...roomMessages, message].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Keep only last 100 messages per room
    const trimmedMessages = newMessages.slice(-100);
    
    return {
      messages: { ...state.messages, [message.room_id]: trimmedMessages }
    };
  }),
  
  clearMessages: (roomId) => set((state) => ({
    messages: { ...state.messages, [roomId]: [] }
  })),
  
  // Connected users actions
  setConnectedUsers: (roomId, users) => set((state) => ({
    connectedUsers: { ...state.connectedUsers, [roomId]: users }
  })),
  
  addConnectedUser: (roomId, user) => set((state) => {
    const currentUsers = state.connectedUsers[roomId] || [];
    if (currentUsers.some(u => u.ghost_id === user.ghost_id)) return state;
    
    return {
      connectedUsers: {
        ...state.connectedUsers,
        [roomId]: [...currentUsers, user]
      }
    };
  }),
  
  removeConnectedUser: (roomId, userId) => set((state) => {
    const currentUsers = state.connectedUsers[roomId] || [];
    return {
      connectedUsers: {
        ...state.connectedUsers,
        [roomId]: currentUsers.filter(u => u.ghost_id !== userId)
      }
    };
  }),
  
  // Connection actions
  setConnected: (connected) => set({ isConnected: connected }),
  
  setConnectionError: (error) => set({ connectionError: error }),
  
  // Typing actions
  setTypingUsers: (roomId, users) => set((state) => ({
    typingUsers: { ...state.typingUsers, [roomId]: users }
  })),
  
  addTypingUser: (roomId, userId) => set((state) => {
    const currentTyping = state.typingUsers[roomId] || [];
    if (currentTyping.includes(userId)) return state;
    
    return {
      typingUsers: {
        ...state.typingUsers,
        [roomId]: [...currentTyping, userId]
      }
    };
  }),
  
  removeTypingUser: (roomId, userId) => set((state) => {
    const currentTyping = state.typingUsers[roomId] || [];
    return {
      typingUsers: {
        ...state.typingUsers,
        [roomId]: currentTyping.filter(id => id !== userId)
      }
    };
  }),
  
  // Stats actions
  setStats: (stats) => set({ stats }),
  
  // Destruction action
  destroy: () => {
    // Clear stored ghost
    storeGhost(undefined);
    
    // Clear all state
    set({
      ghost: undefined,
      currentRoom: undefined,
      rooms: [],
      privateRooms: [],
      messages: {},
      connectedUsers: {},
      isConnected: false,
      connectionError: undefined,
      typingUsers: {},
      stats: { active_ghosts: 0, total_rooms: 0 }
    });
    
    // Clear all local storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }
}));