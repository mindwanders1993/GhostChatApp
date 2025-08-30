-- Migration to add gender and location fields to users table
-- Run this on the database to update schema

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Add indexes if needed for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_location ON users(location);