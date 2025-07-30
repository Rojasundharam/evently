-- Complete setup for Star and View tracking features
-- Run this in your Supabase SQL editor

-- Ensure problems table has views column (should already exist from main setup)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='problems' AND column_name='views'
    ) THEN
        ALTER TABLE problems ADD COLUMN views INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create problem_stars table (private stars for each user)
CREATE TABLE IF NOT EXISTS problem_stars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(user_id, problem_id)
);

-- Create problem_views table (track when users view problems)
CREATE TABLE IF NOT EXISTS problem_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    UNIQUE(user_id, problem_id)
);

-- Create function to update problem views count
CREATE OR REPLACE FUNCTION update_problem_views_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE problems 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = NEW.problem_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE problems 
        SET views = GREATEST(COALESCE(views, 0) - 1, 0)
        WHERE id = OLD.problem_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_problem_views_count_trigger ON problem_views;
CREATE TRIGGER update_problem_views_count_trigger
    AFTER INSERT OR DELETE ON problem_views
    FOR EACH ROW EXECUTE FUNCTION update_problem_views_count();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_problem_stars_user_id ON problem_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_stars_problem_id ON problem_stars(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_stars_created_at ON problem_stars(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_problem_views_user_id ON problem_views(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_views_problem_id ON problem_views(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_views_created_at ON problem_views(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE problem_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stars" ON problem_stars;
DROP POLICY IF EXISTS "Users can insert their own stars" ON problem_stars;
DROP POLICY IF EXISTS "Users can delete their own stars" ON problem_stars;
DROP POLICY IF EXISTS "Users can view their own views" ON problem_views;
DROP POLICY IF EXISTS "Users can insert their own views" ON problem_views;

-- Create RLS policies for problem_stars (users can only see their own stars)
CREATE POLICY "Users can view their own stars" ON problem_stars
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stars" ON problem_stars
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stars" ON problem_stars
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for problem_views (users can only see their own views)
CREATE POLICY "Users can view their own views" ON problem_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own views" ON problem_views
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Grant permissions
GRANT ALL ON problem_stars TO anon, authenticated;
GRANT ALL ON problem_views TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify tables were created successfully
DO $$
BEGIN
    -- Check if problem_stars table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'problem_stars') THEN
        RAISE NOTICE 'SUCCESS: problem_stars table created/exists';
    ELSE
        RAISE EXCEPTION 'FAILED: problem_stars table was not created';
    END IF;
    
    -- Check if problem_views table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'problem_views') THEN
        RAISE NOTICE 'SUCCESS: problem_views table created/exists';
    ELSE
        RAISE EXCEPTION 'FAILED: problem_views table was not created';
    END IF;
    
    -- Check if views column exists in problems table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'problems' AND column_name = 'views') THEN
        RAISE NOTICE 'SUCCESS: problems.views column exists';
    ELSE
        RAISE EXCEPTION 'FAILED: problems.views column does not exist';
    END IF;
    
    RAISE NOTICE 'All star and view tracking features have been set up successfully!';
END $$; 