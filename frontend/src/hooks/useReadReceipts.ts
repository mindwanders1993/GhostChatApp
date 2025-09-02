import { useEffect, useRef, useCallback } from 'react';

interface UseReadReceiptsProps {
  markMessageAsRead: (messageId: string, roomId: string) => void;
  currentRoom: string | undefined;
  currentUserId: string;
}

export const useReadReceipts = ({ markMessageAsRead, currentRoom, currentUserId }: UseReadReceiptsProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const readMessagesRef = useRef<Set<string>>(new Set());

  // Initialize intersection observer
  useEffect(() => {
    if (!currentRoom) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageElement = entry.target as HTMLElement;
            const messageId = messageElement.dataset.messageId;
            const senderId = messageElement.dataset.senderId;
            
            // Only mark messages from other users as read
            if (messageId && senderId && senderId !== currentUserId && currentRoom) {
              // Prevent duplicate read receipts
              if (!readMessagesRef.current.has(messageId)) {
                readMessagesRef.current.add(messageId);
                markMessageAsRead(messageId, currentRoom);
              }
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // Message must be 50% visible
      }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [currentRoom, currentUserId, markMessageAsRead]);

  // Clear read messages when room changes
  useEffect(() => {
    readMessagesRef.current.clear();
  }, [currentRoom]);

  // Function to observe a message element
  const observeMessage = useCallback((element: HTMLElement | null) => {
    if (!element || !observerRef.current) return;

    observerRef.current.observe(element);
  }, []);

  // Function to unobserve a message element
  const unobserveMessage = useCallback((element: HTMLElement | null) => {
    if (!element || !observerRef.current) return;

    observerRef.current.unobserve(element);
  }, []);

  return {
    observeMessage,
    unobserveMessage
  };
};