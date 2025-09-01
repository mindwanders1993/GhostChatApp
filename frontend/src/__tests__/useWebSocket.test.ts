import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../hooks/useWebSocket';
import { GhostIdentity } from '../types';
import { vi } from 'vitest';

// Mock the chat store
vi.mock('../store/chatStore', () => ({
  useChatStore: () => ({
    setConnected: vi.fn(),
    setConnectionError: vi.fn(),
    setRooms: vi.fn(),
    addRoom: vi.fn(),
    addMessage: vi.fn(),
    setMessages: vi.fn(),
    addConnectedUser: vi.fn(),
    removeConnectedUser: vi.fn(),
    setConnectedUsers: vi.fn(),
    addTypingUser: vi.fn(),
    removeTypingUser: vi.fn(),
    setStats: vi.fn()
  })
}));

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string) {
    // Mock send implementation
  }

  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', { code: code || 1000, reason });
      this.onclose(closeEvent);
    }
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('useWebSocket Hook', () => {
  const mockGhost: GhostIdentity = {
    ghost_id: 'test_ghost_123',
    display_name: 'Ghost Test',
    avatar_color: '#ff0000',
    created_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should initialize without ghost', () => {
    const { result } = renderHook(() => useWebSocket(undefined));

    expect(result.current.connect).toBeInstanceOf(Function);
    expect(result.current.disconnect).toBeInstanceOf(Function);
    expect(result.current.sendMessage).toBeInstanceOf(Function);
  });

  test('should provide WebSocket actions', async () => {
    const { result } = renderHook(() => useWebSocket(mockGhost));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.joinRoom).toBeInstanceOf(Function);
    expect(result.current.leaveRoom).toBeInstanceOf(Function);
    expect(result.current.sendChatMessage).toBeInstanceOf(Function);
    expect(result.current.createRoom).toBeInstanceOf(Function);
    expect(result.current.listRooms).toBeInstanceOf(Function);
    expect(result.current.sendTyping).toBeInstanceOf(Function);
  });

  test('should provide sendMessage function that handles disconnected state', async () => {
    const { result } = renderHook(() => useWebSocket(mockGhost));

    // Immediately disconnect to test disconnected state
    act(() => {
      result.current.disconnect();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    act(() => {
      // Should not throw when disconnected
      const success = result.current.sendMessage({ type: 'test' });
      expect(success).toBe(false);
    });
  });

  test('should provide action functions that handle disconnected state', async () => {
    const { result } = renderHook(() => useWebSocket(mockGhost));

    // Immediately disconnect to test disconnected state
    act(() => {
      result.current.disconnect();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    act(() => {
      // Should not throw when disconnected
      const joinSuccess = result.current.joinRoom('room_123');
      const messageSuccess = result.current.sendChatMessage('room_123', 'Hello!');
      const typingSuccess = result.current.sendTyping('room_123', true);
      
      expect(joinSuccess).toBe(false);
      expect(messageSuccess).toBe(false);
      expect(typingSuccess).toBe(false);
    });
  });

  test('should disconnect cleanly when unmounted', () => {
    const { unmount } = renderHook(() => useWebSocket(mockGhost));

    expect(() => unmount()).not.toThrow();
  });
});