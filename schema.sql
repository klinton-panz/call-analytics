-- Call Analytics Database Schema
-- Run this in your PostgreSQL database (Supabase SQL Editor)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table first
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create the api_keys table for authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create the calls table with user_id
CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(50),
  direction VARCHAR(20) DEFAULT 'inbound',
  status VARCHAR(100),
  summary TEXT,
  call_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calls_timestamp ON calls (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_calls_phone ON calls (phone);
CREATE INDEX IF NOT EXISTS idx_calls_contact_name ON calls (contact_name);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls (status);
CREATE INDEX IF NOT EXISTS idx_calls_direction ON calls (direction);
CREATE INDEX IF NOT EXISTS idx_calls_call_id ON calls (call_id);
CREATE INDEX IF NOT EXISTS idx_calls_timestamp_status ON calls (timestamp DESC, status);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);

-- Create indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- RLS Policies for api_keys table
CREATE POLICY "Users can view their own API keys" ON api_keys
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- RLS Policies for calls table
CREATE POLICY "Users can view their own calls" ON calls
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own calls" ON calls
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own calls" ON calls
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Insert a test user and API key (you can modify these values)
INSERT INTO users (id, email, name) VALUES 
  (uuid_generate_v4(), 'test@example.com', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Get the user ID we just created
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com' LIMIT 1;
    
    -- Insert API key for the test user
    INSERT INTO api_keys (user_id, key, name) VALUES 
      (test_user_id, 'test-key-123', 'Test API Key')
    ON CONFLICT (key) DO NOTHING;
END $$;

-- Sample data for testing (optional - uncomment if needed)
/*
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com' LIMIT 1;
    
    INSERT INTO calls (timestamp, contact_name, phone, direction, status, summary, call_id, user_id) VALUES
    ('2025-08-23 10:14:00', 'Mark', '(215) 565-5082', 'inbound', 'Qualified', 'Mark called about pool installation', 'call_001', test_user_id),
    ('2025-08-22 14:30:00', 'Jessica Kunz', '(408) 234-1354', 'inbound', 'Not Qualified', 'Jessica called but not in service area', 'call_002', test_user_id),
    ('2025-08-22 09:45:00', 'Chad Weeks', '(919) 422-0118', 'inbound', 'Qualified', 'Chad called about heating options', 'call_003', test_user_id);
END $$;
*/