-- Setup script for discussion categories
-- Run this in your Supabase SQL editor if discussion categories are missing

-- Create discussion categories table if it doesn't exist
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

-- Create policies for discussion categories
DROP POLICY IF EXISTS "Anyone can view discussion categories" ON discussion_categories;
CREATE POLICY "Anyone can view discussion categories" ON discussion_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage discussion categories" ON discussion_categories;
CREATE POLICY "Admins can manage discussion categories" ON discussion_categories
    FOR ALL USING (true); -- Temporarily allow all operations

-- Insert sample categories with proper UUIDs (matching fallback categories)
INSERT INTO discussion_categories (id, name, description, icon, color, sort_order) VALUES
  ('tech-uuid-001-4567-8901-234567890123', 'Technology', 'Tech innovations and digital solutions', '💻', 'from-blue-500 to-indigo-600', 1),
  ('heal-uuid-001-4567-8901-234567890123', 'Healthcare', 'Medical innovations and health tech', '🏥', 'from-green-500 to-emerald-600', 2),
  ('educ-uuid-001-4567-8901-234567890123', 'Education', 'Educational technology and learning methods', '📚', 'from-yellow-500 to-orange-600', 3),
  ('envr-uuid-001-4567-8901-234567890123', 'Environment', 'Sustainability and environmental initiatives', '🌱', 'from-purple-500 to-pink-600', 4),
  ('finc-uuid-001-4567-8901-234567890123', 'Finance', 'Fintech and financial innovations', '💰', 'from-cyan-500 to-blue-600', 5),
  ('socl-uuid-001-4567-8901-234567890123', 'Social Impact', 'Community building and social innovations', '🤝', 'from-pink-500 to-rose-600', 6),
  ('genr-uuid-001-4567-8901-234567890123', 'General Discussion', 'Open forum for all topics', '💬', 'from-gray-500 to-gray-600', 7),
  ('ques-uuid-001-4567-8901-234567890123', 'Q&A', 'Questions and answers', '❓', 'from-indigo-500 to-purple-600', 8)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Enable realtime for discussion categories
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_categories;

-- Check if categories were created successfully
SELECT 
    name,
    description,
    icon,
    color,
    thread_count,
    post_count,
    sort_order
FROM discussion_categories
ORDER BY sort_order; 