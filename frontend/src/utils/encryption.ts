/**
 * Client-side End-to-End Encryption Utilities
 * 
 * Provides encryption/decryption for messages before they leave the client.
 * Uses Web Crypto API for secure key generation and AES-GCM encryption.
 */

export interface EncryptionKeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}

export interface EncryptedMessage {
  encryptedContent: string;      // Base64 encoded encrypted message
  iv: string;                    // Base64 encoded initialization vector
  ephemeralPublicKey?: string;   // Base64 encoded ephemeral public key for key exchange
  keyId: string;                 // Key identifier for decryption
}

export interface MessageKeys {
  encryptionKey: CryptoKey;
  keyId: string;
}

class EncryptionManager {
  private keyPairs: Map<string, EncryptionKeyPair> = new Map();
  private roomKeys: Map<string, MessageKeys> = new Map();
  private ephemeralKeys: Map<string, CryptoKey> = new Map();

  /**
   * Generate a new ECDH key pair for key exchange
   */
  async generateKeyPair(): Promise<EncryptionKeyPair> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true, // extractable
        ['deriveKey']
      );

      return {
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey
      };
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw new Error('Key generation failed');
    }
  }

  /**
   * Generate a symmetric encryption key for a room
   */
  async generateRoomKey(roomId: string): Promise<MessageKeys> {
    try {
      const encryptionKey = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true, // extractable for storage
        ['encrypt', 'decrypt']
      );

      const keyId = `room_${roomId}_${Date.now()}`;
      const messageKeys: MessageKeys = {
        encryptionKey,
        keyId
      };

      this.roomKeys.set(roomId, messageKeys);
      return messageKeys;
    } catch (error) {
      console.error('Failed to generate room key:', error);
      throw new Error('Room key generation failed');
    }
  }

  /**
   * Derive shared secret from ECDH key exchange
   */
  async deriveSharedKey(
    privateKey: CryptoKey,
    publicKey: CryptoKey,
    keyId: string
  ): Promise<CryptoKey> {
    try {
      const sharedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: publicKey
        },
        privateKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      return sharedKey;
    } catch (error) {
      console.error('Failed to derive shared key:', error);
      throw new Error('Key derivation failed');
    }
  }

  /**
   * Encrypt message content
   */
  async encryptMessage(
    content: string,
    roomId: string,
    formatting?: any
  ): Promise<EncryptedMessage> {
    try {
      let messageKeys = this.roomKeys.get(roomId);
      
      // Generate room key if it doesn't exist
      if (!messageKeys) {
        messageKeys = await this.generateRoomKey(roomId);
      }

      // Prepare the payload (content + formatting)
      const payload = JSON.stringify({
        content,
        formatting: formatting || null,
        timestamp: Date.now()
      });

      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt the payload
      const encodedPayload = new TextEncoder().encode(payload);
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        messageKeys.encryptionKey,
        encodedPayload
      );

      return {
        encryptedContent: this.arrayBufferToBase64(encryptedData),
        iv: this.arrayBufferToBase64(iv.buffer),
        keyId: messageKeys.keyId
      };
    } catch (error) {
      console.error('Message encryption failed:', error);
      throw new Error('Message encryption failed');
    }
  }

  /**
   * Decrypt message content
   */
  async decryptMessage(
    encryptedMessage: EncryptedMessage,
    roomId: string
  ): Promise<{content: string; formatting?: any}> {
    try {
      const messageKeys = this.roomKeys.get(roomId);
      if (!messageKeys || messageKeys.keyId !== encryptedMessage.keyId) {
        throw new Error('Decryption key not found or key mismatch');
      }

      // Convert base64 back to ArrayBuffer
      const encryptedData = this.base64ToArrayBuffer(encryptedMessage.encryptedContent);
      const iv = this.base64ToArrayBuffer(encryptedMessage.iv);

      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        messageKeys.encryptionKey,
        encryptedData
      );

      // Parse the decrypted payload
      const decryptedText = new TextDecoder().decode(decryptedData);
      const payload = JSON.parse(decryptedText);

      return {
        content: payload.content,
        formatting: payload.formatting
      };
    } catch (error) {
      console.error('Message decryption failed:', error);
      throw new Error('Message decryption failed');
    }
  }

  /**
   * Export public key for sharing with other participants
   */
  async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    try {
      const exported = await window.crypto.subtle.exportKey('spki', publicKey);
      return this.arrayBufferToBase64(exported);
    } catch (error) {
      console.error('Public key export failed:', error);
      throw new Error('Public key export failed');
    }
  }

  /**
   * Import public key from base64 string
   */
  async importPublicKey(keyData: string): Promise<CryptoKey> {
    try {
      const keyBuffer = this.base64ToArrayBuffer(keyData);
      return await window.crypto.subtle.importKey(
        'spki',
        keyBuffer,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        []
      );
    } catch (error) {
      console.error('Public key import failed:', error);
      throw new Error('Public key import failed');
    }
  }

  /**
   * Generate ephemeral key pair for forward secrecy
   */
  async generateEphemeralKeyPair(roomId: string): Promise<{publicKey: string; keyId: string}> {
    try {
      const keyPair = await this.generateKeyPair();
      const keyId = `ephemeral_${roomId}_${Date.now()}`;
      
      // Store ephemeral private key temporarily
      this.ephemeralKeys.set(keyId, keyPair.privateKey);
      
      // Export public key for sharing
      const publicKeyString = await this.exportPublicKey(keyPair.publicKey);
      
      return {
        publicKey: publicKeyString,
        keyId
      };
    } catch (error) {
      console.error('Ephemeral key generation failed:', error);
      throw new Error('Ephemeral key generation failed');
    }
  }

  /**
   * Clear encryption keys for a room (forward secrecy)
   */
  clearRoomKeys(roomId: string): void {
    this.roomKeys.delete(roomId);
    
    // Clear ephemeral keys for this room
    const keysToDelete: string[] = [];
    this.ephemeralKeys.forEach((key, keyId) => {
      if (keyId.includes(roomId)) {
        keysToDelete.push(keyId);
      }
    });
    keysToDelete.forEach(keyId => {
      this.ephemeralKeys.delete(keyId);
    });
    
    console.log(`Cleared encryption keys for room: ${roomId}`);
  }

  /**
   * Check if Web Crypto API is supported
   */
  isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.subtle.generateKey === 'function' &&
      typeof window.crypto.subtle.encrypt === 'function' &&
      typeof window.crypto.subtle.decrypt === 'function'
    );
  }

  /**
   * Get room encryption status
   */
  hasRoomKey(roomId: string): boolean {
    return this.roomKeys.has(roomId);
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export singleton instance
export const encryptionManager = new EncryptionManager();

// Export utility functions
export const checkEncryptionSupport = (): {supported: boolean; reason?: string} => {
  if (typeof window === 'undefined') {
    return {supported: false, reason: 'Window not available (server-side)'};
  }

  if (!window.crypto) {
    return {supported: false, reason: 'Web Crypto API not available'};
  }
  
  if (!window.crypto.subtle) {
    return {supported: false, reason: 'SubtleCrypto not available'};
  }
  
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    return {supported: false, reason: 'HTTPS required for encryption'};
  }
  
  return {supported: true};
};

/**
 * Initialize encryption for a new room
 */
export const initializeRoomEncryption = async (roomId: string): Promise<void> => {
  try {
    const support = checkEncryptionSupport();
    if (!support.supported) {
      throw new Error(support.reason);
    }
    
    await encryptionManager.generateRoomKey(roomId);
    console.log(`🔐 Encryption initialized for room: ${roomId}`);
  } catch (error) {
    console.error('Failed to initialize room encryption:', error);
    throw error;
  }
};

/**
 * Encrypt message before sending
 */
export const encryptForSending = async (
  content: string,
  roomId: string,
  formatting?: any
): Promise<EncryptedMessage> => {
  const support = checkEncryptionSupport();
  if (!support.supported) {
    console.warn('Encryption not supported, sending plaintext');
    throw new Error('Encryption not available');
  }
  
  return await encryptionManager.encryptMessage(content, roomId, formatting);
};

/**
 * Decrypt received message
 */
export const decryptReceived = async (
  encryptedMessage: EncryptedMessage,
  roomId: string
): Promise<{content: string; formatting?: any}> => {
  return await encryptionManager.decryptMessage(encryptedMessage, roomId);
};

/**
 * Clean up encryption keys when leaving room
 */
export const cleanupRoomEncryption = (roomId: string): void => {
  encryptionManager.clearRoomKeys(roomId);
  console.log(`🔐 Cleaned up encryption for room: ${roomId}`);
};