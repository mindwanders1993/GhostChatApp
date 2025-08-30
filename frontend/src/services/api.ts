import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, AuthResponse, UserRegistration, MatchingPreferences, MatchResult, ReportData } from '../types/chat';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async register(userData: UserRegistration): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async refreshToken(): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    const response = await this.api.post('/auth/refresh');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.delete('/auth/logout');
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/auth/me');
    return response.data;
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/auth/me', userData);
    return response.data;
  }

  async verifyAge(): Promise<void> {
    await this.api.post('/auth/verify-age');
  }

  // Matching endpoints
  async findMatch(preferences: MatchingPreferences): Promise<MatchResult> {
    const response: AxiosResponse<MatchResult> = await this.api.post('/matching/find', {
      preferences,
    });
    return response.data;
  }

  async getMatchingStatus(): Promise<MatchResult> {
    const response: AxiosResponse<MatchResult> = await this.api.get('/matching/status');
    return response.data;
  }

  async cancelMatching(): Promise<void> {
    await this.api.delete('/matching/cancel');
  }

  // Chat endpoints
  async createRoom(roomData: {
    room_type: string;
    name?: string;
    description?: string;
    max_participants?: number;
  }) {
    const response = await this.api.post('/chat/rooms', roomData);
    return response.data;
  }

  async getRoom(roomId: string) {
    const response = await this.api.get(`/chat/rooms/${roomId}`);
    return response.data;
  }

  async joinRoom(roomId: string) {
    const response = await this.api.post(`/chat/rooms/${roomId}/join`);
    return response.data;
  }

  async leaveRoom(roomId: string) {
    const response = await this.api.delete(`/chat/rooms/${roomId}/leave`);
    return response.data;
  }

  // Moderation endpoints
  async reportUser(reportData: ReportData): Promise<void> {
    await this.api.post('/moderation/reports', reportData);
  }

  async blockUser(userId: string, reason?: string): Promise<void> {
    await this.api.post('/moderation/blocks', {
      blocked_user_id: userId,
      reason,
    });
  }

  async getSafetyGuidelines() {
    const response = await this.api.get('/moderation/guidelines');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export default new ApiService();