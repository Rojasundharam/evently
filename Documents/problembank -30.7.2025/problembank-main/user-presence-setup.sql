-- Drop table if exists to recreate with proper setup
DROP TABLE IF EXISTS user_presence CASCADE;

-- Create user_presence table for real-time presence tracking
CREATE TABLE user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  is_online BOOLEAN DEFAULT false NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Add foreign key constraint
ALTER TABLE user_presence 
ADD CONSTRAINT fk_user_presence_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all presence data" ON user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_presence;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_presence;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_presence;

-- Create comprehensive RLS policies
CREATE POLICY "Enable read access for authenticated users" ON user_presence
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON user_presence
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON user_presence
  FOR UPDATE USING (auth.role() = 'authenticated' AND auth.uid() = user_id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

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

-- Optional: Create a function to initialize presence for existing users
CREATE OR REPLACE FUNCTION initialize_user_presence()
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, is_online, last_seen)
  SELECT 
    id,
    false,
    now()
  FROM auth.users 
  WHERE id NOT IN (SELECT user_id FROM user_presence)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Run the initialization (optional)
-- SELECT initialize_user_presence();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_presence TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_online_user_count() TO authenticated;

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence; 