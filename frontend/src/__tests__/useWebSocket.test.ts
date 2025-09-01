import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../hooks/useWebSocket';
import { GhostIdentity } from '../types';

// Mock the chat store
jest.mock('../store/chatStore', () => ({
  useChatStore: () => ({
    setConnected: jest.fn(),
    setConnectionError: jest.fn(),
    setRooms: jest.fn(),
    addRoom: jest.fn(),
    addMessage: jest.fn(),
    setMessages: jest.fn(),
    addConnectedUser: jest.fn(),
    removeConnectedUser: jest.fn(),
    setConnectedUsers: jest.fn(),
    addTypingUser: jest.fn(),
    removeTypingUser: jest.fn(),
    setStats: jest.fn()
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
    jest.clearAllMocks();
  });

  test('should initialize without ghost', () => {
    const { result } = renderHook(() => useWebSocket(undefined));

    expect(result.current.connect).toBeInstanceOf(Function);
    expect(result.current.disconnect).toBeInstanceOf(Function);
    expect(result.current.sendMessage).toBeInstanceOf(Function);
  });

  test('should provide WebSocket actions', () => {
    const { result } = renderHook(() => useWebSocket(mockGhost));

    expect(result.current.joinRoom).toBeInstanceOf(Function);
    expect(result.current.leaveRoom).toBeInstanceOf(Function);
    expect(result.current.sendChatMessage).toBeInstanceOf(Function);
    expect(result.current.createRoom).toBeInstanceOf(Function);
    expect(result.current.listRooms).toBeInstanceOf(Function);
    expect(result.current.sendTyping).toBeInstanceOf(Function);
  });

  test('should send messages when connected', async () => {
    const { result } = renderHook(() => useWebSocket(mockGhost));

    await act(async () => {
      // Wait for connection to establish
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    act(() => {
      const success = result.current.sendMessage({ type: 'test' });
      expect(success).toBe(true);
    });
  });

  test('should handle room joining', async () => {
    const { result } = renderHook(() => useWebSocket(mockGhost));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    act(() => {
      const success = result.current.joinRoom('room_123');
      expect(success).toBe(true);
    });
  });

  test('should handle message sending', async () => {
    const { result } = renderHook(() => useWebSocket(mockGhost));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    act(() => {
      const success = result.current.sendChatMessage('room_123', 'Hello!');
      expect(success).toBe(true);
    });
  });

  test('should handle typing indicators', async () => {
    const { result } = renderHook(() => useWebSocket(mockGhost));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    act(() => {
      const success = result.current.sendTyping('room_123', true);
      expect(success).toBe(true);
    });
  });

  test('should disconnect when unmounted', () => {
    const { unmount } = renderHook(() => useWebSocket(mockGhost));

    unmount();
    // Should not throw error
  });
});