-- Fix Discussion Categories - Run this in your Supabase SQL Editor
-- This script ensures all discussion categories exist with the correct IDs

-- First, check if table exists and create if needed
CREATE TABLE IF NOT EXISTS discussion_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE discussion_categories ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DROP POLICY IF EXISTS "Anyone can view discussion categories" ON discussion_categories;
CREATE POLICY "Anyone can view discussion categories" ON discussion_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON discussion_categories;
CREATE POLICY "Authenticated users can manage categories" ON discussion_categories
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert categories with proper UUIDs (these will be used in the app)
INSERT INTO discussion_categories (id, name, description, icon, color, sort_order) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Technology', 'Tech innovations and digital solutions', '💻', 'from-blue-500 to-indigo-600', 1),
  ('a0000000-0000-4000-8000-000000000002', 'Healthcare', 'Medical innovations and health tech', '🏥', 'from-green-500 to-emerald-600', 2),
  ('a0000000-0000-4000-8000-000000000003', 'Education', 'Educational technology and learning methods', '📚', 'from-yellow-500 to-orange-600', 3),
  ('a0000000-0000-4000-8000-000000000004', 'Environment', 'Sustainability and environmental initiatives', '🌱', 'from-purple-500 to-pink-600', 4),
  ('a0000000-0000-4000-8000-000000000005', 'Finance', 'Fintech and financial innovations', '💰', 'from-cyan-500 to-blue-600', 5),
  ('a0000000-0000-4000-8000-000000000006', 'Social Impact', 'Community building and social innovations', '🤝', 'from-pink-500 to-rose-600', 6),
  ('a0000000-0000-4000-8000-000000000007', 'General Discussion', 'Open forum for all topics', '💬', 'from-gray-500 to-gray-600', 7),
  ('a0000000-0000-4000-8000-000000000008', 'Q&A', 'Questions and answers', '❓', 'from-indigo-500 to-purple-600', 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Enable realtime for discussion categories (handle case where already added)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE discussion_categories;
        RAISE NOTICE 'Successfully added discussion_categories to supabase_realtime publication';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'discussion_categories already exists in supabase_realtime publication - skipping';
    END;
END $$;

-- Check if categories were created successfully
SELECT 
    id,
    name,
    description,
    icon,
    color,
    thread_count,
    post_count,
    sort_order,
    created_at
FROM discussion_categories
ORDER BY sort_order; 