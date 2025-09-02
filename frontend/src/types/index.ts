export interface GhostIdentity {
  ghost_id: string;
  display_name: string;
  custom_name?: string;
  age?: string;
  gender?: string;
  country?: string;
  avatar: {
    background_color: string;
    text_color: string;
    initials: string;
    avatar_id?: string;
    emoji?: string;
  };
  session_ttl: number;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reactors: string[];
  displayNames: string[];
}

export interface MessageStatus {
  sent: boolean;
  sent_at: string;
  delivered: { [ghost_id: string]: string };
  read: { [ghost_id: string]: string };
}

export interface Message {
  id: string;
  sender: string;
  sender_display?: string;
  content: string;
  room_id: string;
  timestamp: string;
  reactions?: { [emoji: string]: MessageReaction };
  status?: MessageStatus;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  participant_count: number;
  heat_level: number;
  is_public?: boolean;
  is_private?: boolean;
  participants?: string[];
  room_type?: string;
}

export interface WebSocketMessage {
  type: 'connection_established' | 'room_joined' | 'room_left' | 'new_message' | 
        'ghost_joined' | 'ghost_left' | 'room_created' | 'room_list' | 'error' |
        'heartbeat' | 'pong' | 'typing_indicator' | 'stats_update' | 'message_reaction' |
        'message_status_update';
  [key: string]: any;
}

export interface ProofOfWorkChallenge {
  challenge_id: string;
  random_data: string;
  difficulty: number;
  expires_in: number;
  target: string;
  instructions: string;
}

export interface ProofOfWorkSolution {
  challenge_id: string;
  nonce: string;
}

export interface RoomMember {
  ghost_id: string;
  display_name: string;
}

export interface ChatState {
  ghost?: GhostIdentity;
  currentRoom?: string;
  rooms: Room[];
  privateRooms: Room[];
  messages: { [roomId: string]: Message[] };
  connectedUsers: { [roomId: string]: RoomMember[] };
  isConnected: boolean;
  connectionError?: string;
  typingUsers: { [roomId: string]: string[] };
}

export interface AppStats {
  active_ghosts: number;
  total_rooms: number;
  message?: string;
}

export interface DestructionTimer {
  timeLeft: number;
  isExpired: boolean;
  warningThreshold: number;
}

export interface UserPreferences {
  custom_name: string;
  age: string;
  gender: string;
  country: string;
  avatar_id: string;
}

export interface Avatar {
  id: string;
  emoji: string;
  name: string;
  background_color: string;
}