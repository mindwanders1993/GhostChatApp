export interface User {
  id: string;
  anonymous_id: string;
  nickname: string;
  karma_score: number;
  is_active: boolean;
  age_verified: boolean;
  created_at?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_nickname?: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'emoji' | 'url' | 'audio' | 'whisper' | 'deleted';
  formatting?: Record<string, any>;
  metadata?: Record<string, any>;
  sent_at: string;
  expires_at?: string;
  is_whisper?: boolean;
  whisper_to_id?: string;
  whisper_to_nickname?: string;
  reply_to_id?: string;
  mentioned_users?: string[];
  reactions?: MessageReaction[];
  delivery_status?: 'sending' | 'sent' | 'delivered' | 'read';
  is_edited?: boolean;
  edited_at?: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  user_nickname?: string;
  emoji: string;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  user_nickname?: string;
  room_id?: string;
  is_online: boolean;
  is_typing: boolean;
  last_seen: string;
  last_activity: string;
  status_message?: string;
}

export interface ChatRoom {
  id: string;
  room_type: 'private' | 'public' | 'group';
  name?: string;
  description?: string;
  max_participants: number;
  is_active: boolean;
  created_at?: string;
  expires_at?: string;
  participants: User[];
  lastMessage?: Message;
}

export interface MatchingPreferences {
  age_range: [number, number];
  interests: string[];
  language: string;
  location?: string;
}

export interface MatchResult {
  status: 'searching' | 'found' | 'timeout' | 'error';
  match_id?: string;
  partner?: {
    anonymous_id: string;
    nickname: string;
  };
  room_id?: string;
  estimated_wait?: number;
  message?: string;
}

export interface TypingIndicator {
  room_id: string;
  user_id: string;
  is_typing: boolean;
}

export interface WebSocketMessage {
  type: string;
  id?: string;
  room_id?: string;
  sender_id?: string;
  sender_nickname?: string;
  user_id?: string;
  user_nickname?: string;
  content?: string;
  message_type?: string;
  timestamp?: string;
  is_whisper?: boolean;
  whisper_to_id?: string;
  whisper_to_nickname?: string;
  reply_to_id?: string;
  mentioned_users?: string[];
  users?: UserPresence[];
  message?: string;
  mentioning_user?: string;
  message_content?: string;
  status_message?: string;
  [key: string]: any;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  message?: string;
}

export interface UserRegistration {
  nickname: string;
  age_verified: boolean;
  gender?: string;
  location?: string;
  preferences?: MatchingPreferences;
}

export interface ReportData {
  reported_user_id: string;
  reason: string;
  description?: string;
  message_id?: string;
  room_id?: string;
}

export interface ModerationWarning {
  type: 'warning' | 'violation' | 'banned';
  message: string;
  reasons?: string[];
  action_required?: boolean;
}

export interface SafetyTip {
  title: string;
  description: string;
  icon: string;
}