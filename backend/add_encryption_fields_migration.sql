-- Add End-to-End Encryption Support to Messages Table
-- Migration: Add encryption fields to messages table

BEGIN;

-- Add encryption fields to messages table
ALTER TABLE messages ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN encryption_iv VARCHAR(255);
ALTER TABLE messages ADD COLUMN encryption_key_id VARCHAR(255);

-- Add indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_is_encrypted ON messages(is_encrypted);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_encryption_key_id ON messages(encryption_key_id);

-- Update existing messages to mark as non-encrypted
UPDATE messages SET is_encrypted = FALSE WHERE is_encrypted IS NULL;

-- Add comments
COMMENT ON COLUMN messages.is_encrypted IS 'Whether this message is end-to-end encrypted';
COMMENT ON COLUMN messages.encryption_iv IS 'Base64 encoded initialization vector for decryption';
COMMENT ON COLUMN messages.encryption_key_id IS 'Key identifier used for encryption/decryption';

COMMIT;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages' 
AND column_name IN ('is_encrypted', 'encryption_iv', 'encryption_key_id');