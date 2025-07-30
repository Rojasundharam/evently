-- Fix activity_logs table schema - Add missing entity_title column
-- Run this in your Supabase SQL editor

-- Add entity_title column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activity_logs' 
        AND column_name = 'entity_title'
    ) THEN
        ALTER TABLE activity_logs ADD COLUMN entity_title TEXT;
    END IF;
END $$;

-- Also ensure entity_type column is not required to be NOT NULL if it doesn't need to be
-- (This makes it consistent with the realtime setup schema)
ALTER TABLE activity_logs ALTER COLUMN entity_type DROP NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);

-- Enable RLS if not already enabled
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for activity_logs
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON activity_logs;

CREATE POLICY "Users can view their own activity logs" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT ON activity_logs TO authenticated;
GRANT ALL ON activity_logs TO service_role; 