-- Simple User Presence Setup
-- This is a simpler version that should work with basic Supabase setup

-- Create user_presence table for real-time presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_online BOOLEAN DEFAULT false NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT unique_user_presence UNIQUE(user_id),
  CONSTRAINT fk_user_presence_auth_users FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies - allow authenticated users to manage their own data
CREATE POLICY "Users can view presence data" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_presence_updated_at ON user_presence;
CREATE TRIGGER trigger_update_user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_updated_at();

-- Function to automatically set users offline after 5 minutes of inactivity
CREATE OR REPLACE FUNCTION cleanup_inactive_users()
RETURNS void AS $$
BEGIN
  UPDATE user_presence 
  SET is_online = false 
  WHERE is_online = true 
    AND last_seen < now() - interval '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to get online user count
CREATE OR REPLACE FUNCTION get_online_user_count()
RETURNS integer AS $$
BEGIN
  RETURN (SELECT count(*) FROM user_presence WHERE is_online = true)::integer;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON user_presence TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_online_user_count() TO authenticated;

-- Enable real-time for the table (if realtime is enabled)
-- Note: Run this separately if you get an error
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Initialize presence for current user (optional - run manually if needed)
-- INSERT INTO user_presence (user_id, is_online, last_seen) 
-- VALUES (auth.uid(), true, now()) 
-- ON CONFLICT (user_id) DO UPDATE SET 
--   is_online = true, 
--   last_seen = now(),
--   updated_at = now(); 