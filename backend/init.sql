-- Initialize database for GhostChatApp
-- This script will be run when the PostgreSQL container starts

-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pg_cron extension for automated cleanup (if available)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to delete expired messages
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM messages WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Log cleanup
    RAISE NOTICE 'Deleted expired messages at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to delete inactive user sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM users 
    WHERE last_active < CURRENT_TIMESTAMP - INTERVAL '24 hours'
    AND is_active = false;
    
    -- Log cleanup
    RAISE NOTICE 'Cleaned up inactive sessions at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate anonymous ID
CREATE OR REPLACE FUNCTION generate_anonymous_id()
RETURNS varchar(32) AS $$
BEGIN
    RETURN 'anon_' || substr(md5(random()::text), 1, 27);
END;
$$ LANGUAGE plpgsql;

-- Function to update user karma based on reports
CREATE OR REPLACE FUNCTION update_user_karma()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease karma for reported user
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        UPDATE users 
        SET karma_score = karma_score - 5 
        WHERE id = NEW.reported_user_id;
    END IF;
    
    -- Increase karma for helpful reporter (if report is valid)
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        UPDATE users 
        SET karma_score = karma_score + 1 
        WHERE id = NEW.reporter_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_room_time ON messages(room_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_expires ON messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON users(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active ON chat_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_unique ON user_blocks(blocker_id, blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

-- Create trigger for karma updates
-- CREATE TRIGGER update_karma_trigger
--     AFTER UPDATE ON reports
--     FOR EACH ROW
--     EXECUTE FUNCTION update_user_karma();

-- If pg_cron is available, schedule cleanup jobs
-- SELECT cron.schedule('delete-expired-messages', '*/10 * * * *', 'SELECT delete_expired_messages();');
-- SELECT cron.schedule('cleanup-inactive-sessions', '0 */6 * * *', 'SELECT cleanup_inactive_sessions();');

COMMIT;