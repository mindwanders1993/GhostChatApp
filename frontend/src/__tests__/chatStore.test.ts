import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '../store/chatStore';
import { Room, Message } from '../types';

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useChatStore.getState();
    store.reset();
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useChatStore());

    expect(result.current.connected).toBe(false);
    expect(result.current.rooms).toEqual([]);
    expect(result.current.messages).toEqual({});
    expect(result.current.connectedUsers).toEqual({});
    expect(result.current.typingUsers).toEqual({});
    expect(result.current.stats).toEqual({ active_ghosts: 0, total_rooms: 0 });
    expect(result.current.connectionError).toBeUndefined();
  });

  test('should set connected state', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setConnected(true);
    });

    expect(result.current.connected).toBe(true);
  });

  test('should set connection error', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setConnectionError('Connection failed');
    });

    expect(result.current.connectionError).toBe('Connection failed');
  });

  test('should add rooms', () => {
    const { result } = renderHook(() => useChatStore());
    const rooms: Room[] = [
      {
        id: 'room1',
        name: 'Test Room 1',
        participant_count: 2,
        created_at: '2024-01-01T00:00:00Z',
        heat_level: 0.5
      }
    ];

    act(() => {
      result.current.setRooms(rooms);
    });

    expect(result.current.rooms).toEqual(rooms);
  });

  test('should add single room', () => {
    const { result } = renderHook(() => useChatStore());
    const room: Room = {
      id: 'room1',
      name: 'Test Room',
      participant_count: 1,
      created_at: '2024-01-01T00:00:00Z',
      heat_level: 0.5
    };

    act(() => {
      result.current.addRoom(room);
    });

    expect(result.current.rooms).toContain(room);
  });

  test('should add message to room', () => {
    const { result } = renderHook(() => useChatStore());
    const message: Message = {
      id: 'msg1',
      sender: 'ghost1',
      content: 'Hello!',
      room_id: 'room1',
      timestamp: '2024-01-01T00:00:00Z'
    };

    act(() => {
      result.current.addMessage(message);
    });

    expect(result.current.messages['room1']).toContain(message);
  });

  test('should set messages for room', () => {
    const { result } = renderHook(() => useChatStore());
    const messages: Message[] = [
      {
        id: 'msg1',
        sender: 'ghost1',
        content: 'Hello!',
        room_id: 'room1',
        timestamp: '2024-01-01T00:00:00Z'
      }
    ];

    act(() => {
      result.current.setMessages('room1', messages);
    });

    expect(result.current.messages['room1']).toEqual(messages);
  });

  test('should add connected user to room', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.addConnectedUser('room1', 'ghost1');
    });

    expect(result.current.connectedUsers['room1']).toContain('ghost1');
  });

  test('should remove connected user from room', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.setConnectedUsers('room1', ['ghost1', 'ghost2']);
      result.current.removeConnectedUser('room1', 'ghost1');
    });

    expect(result.current.connectedUsers['room1']).not.toContain('ghost1');
    expect(result.current.connectedUsers['room1']).toContain('ghost2');
  });

  test('should add typing user', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.addTypingUser('room1', 'ghost1');
    });

    expect(result.current.typingUsers['room1']).toContain('ghost1');
  });

  test('should remove typing user', () => {
    const { result } = renderHook(() => useChatStore());

    act(() => {
      result.current.addTypingUser('room1', 'ghost1');
      result.current.addTypingUser('room1', 'ghost2');
      result.current.removeTypingUser('room1', 'ghost1');
    });

    expect(result.current.typingUsers['room1']).not.toContain('ghost1');
    expect(result.current.typingUsers['room1']).toContain('ghost2');
  });

  test('should set stats', () => {
    const { result } = renderHook(() => useChatStore());
    const stats = { active_ghosts: 10, total_rooms: 5 };

    act(() => {
      result.current.setStats(stats);
    });

    expect(result.current.stats).toEqual(stats);
  });

  test('should reset store state', () => {
    const { result } = renderHook(() => useChatStore());

    // Set some state first
    act(() => {
      result.current.setConnected(true);
      result.current.setRooms([{
        id: 'room1',
        name: 'Test',
        participant_count: 1,
        created_at: '2024-01-01T00:00:00Z',
        heat_level: 0.5
      }]);
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.connected).toBe(false);
    expect(result.current.rooms).toEqual([]);
  });
});