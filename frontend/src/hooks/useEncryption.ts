/**
 * React Hook for End-to-End Encryption
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  encryptionManager, 
  checkEncryptionSupport, 
  initializeRoomEncryption,
  encryptForSending,
  decryptReceived,
  cleanupRoomEncryption,
  EncryptedMessage
} from '../utils/encryption';

interface EncryptionStatus {
  supported: boolean;
  enabled: boolean;
  reason?: string;
}

interface UseEncryptionReturn {
  encryptionStatus: EncryptionStatus;
  encryptMessage: (content: string, roomId: string, formatting?: any) => Promise<EncryptedMessage>;
  decryptMessage: (encryptedMessage: EncryptedMessage, roomId: string) => Promise<{content: string; formatting?: any}>;
  initializeRoom: (roomId: string) => Promise<void>;
  cleanupRoom: (roomId: string) => void;
  hasRoomKey: (roomId: string) => boolean;
  toggleEncryption: (enabled: boolean) => void;
}

export const useEncryption = (): UseEncryptionReturn => {
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionStatus>({
    supported: false,
    enabled: false
  });

  // Check encryption support on mount
  useEffect(() => {
    const support = checkEncryptionSupport();
    setEncryptionStatus({
      supported: support.supported,
      enabled: support.supported,
      reason: support.reason
    });
  }, []);

  // Initialize encryption for a room
  const initializeRoom = useCallback(async (roomId: string): Promise<void> => {
    if (!encryptionStatus.supported || !encryptionStatus.enabled) {
      return;
    }
    await initializeRoomEncryption(roomId);
  }, [encryptionStatus.supported, encryptionStatus.enabled]);

  // Encrypt message before sending
  const encryptMessage = useCallback(async (
    content: string, 
    roomId: string, 
    formatting?: any
  ): Promise<EncryptedMessage> => {
    if (!encryptionStatus.supported || !encryptionStatus.enabled) {
      return {
        encryptedContent: btoa(JSON.stringify({ content, formatting })),
        iv: btoa('no-encryption-fallback'),
        keyId: 'plaintext'
      };
    }
    return await encryptForSending(content, roomId, formatting);
  }, [encryptionStatus.supported, encryptionStatus.enabled]);

  // Decrypt received message
  const decryptMessage = useCallback(async (
    encryptedMessage: EncryptedMessage, 
    roomId: string
  ): Promise<{content: string; formatting?: any}> => {
    if (encryptedMessage.keyId === 'plaintext') {
      try {
        const decoded = JSON.parse(atob(encryptedMessage.encryptedContent));
        return { content: decoded.content, formatting: decoded.formatting };
      } catch {
        return { content: '[Decryption Error]', formatting: null };
      }
    }

    if (!encryptionStatus.supported || !encryptionStatus.enabled) {
      return { content: '[Encrypted Message - Encryption Not Available]', formatting: null };
    }

    try {
      return await decryptReceived(encryptedMessage, roomId);
    } catch {
      return { content: '[Decryption Failed]', formatting: null };
    }
  }, [encryptionStatus.supported, encryptionStatus.enabled]);

  // Clean up room encryption keys
  const cleanupRoom = useCallback((roomId: string): void => {
    if (encryptionStatus.supported) {
      cleanupRoomEncryption(roomId);
    }
  }, [encryptionStatus.supported]);

  // Check if room has encryption key
  const hasRoomKey = useCallback((roomId: string): boolean => {
    if (!encryptionStatus.supported || !encryptionStatus.enabled) {
      return false;
    }
    return encryptionManager.hasRoomKey(roomId);
  }, [encryptionStatus.supported, encryptionStatus.enabled]);

  // Toggle encryption on/off
  const toggleEncryption = useCallback((enabled: boolean): void => {
    const support = checkEncryptionSupport();
    setEncryptionStatus({
      supported: support.supported,
      enabled: support.supported && enabled,
      reason: support.reason
    });
  }, []);

  return {
    encryptionStatus,
    encryptMessage,
    decryptMessage,
    initializeRoom,
    cleanupRoom,
    hasRoomKey,
    toggleEncryption
  };
};