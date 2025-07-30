-- Problembank II: Authentication & Role-Based Access Control Setup
-- Run this in your Supabase SQL Editor after the main database-setup.sql

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'industry_expert', 'student');

-- Create user status enum  
CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended');

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT CHECK (LENGTH(bio) <= 160),
    country TEXT,
    role user_role DEFAULT 'student',
    status user_status DEFAULT 'active',
    problems_submitted INTEGER DEFAULT 0,
    solutions_posted INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table for notifications
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    problem_replies BOOLEAN DEFAULT true,
    leaderboard_updates BOOLEAN DEFAULT true,
    product_announcements BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true
);

-- Create discussion categories table
CREATE TABLE IF NOT EXISTS discussion_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0
);

-- Create discussion threads table
CREATE TABLE IF NOT EXISTS discussion_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id UUID REFERENCES discussion_categories(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discussion posts table (replies to threads)
CREATE TABLE IF NOT EXISTS discussion_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    content TEXT NOT NULL,
    thread_id UUID REFERENCES discussion_threads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    parent_post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    is_solution BOOLEAN DEFAULT false
);

-- Enable RLS for new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (auth.uid() = id);
CREATE POLICY "Anyone can view categories" ON discussion_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view threads" ON discussion_threads FOR SELECT USING (true);
CREATE POLICY "Anyone can view posts" ON discussion_posts FOR SELECT USING (true);

-- Insert default discussion categories
INSERT INTO discussion_categories (name, description, icon, color) VALUES 
('Technology', 'Discuss tech innovations, programming, and digital solutions', '💻', 'from-blue-500 to-indigo-600'),
('Healthcare', 'Medical innovations, health tech, and healthcare solutions', '🏥', 'from-green-500 to-emerald-600'),
('Education', 'Educational technology, learning methods, and academic discussions', '📚', 'from-yellow-500 to-orange-600'),
('Environment', 'Sustainability, climate solutions, and environmental initiatives', '🌱', 'from-purple-500 to-pink-600'),
('Finance', 'Fintech, economic solutions, and financial innovations', '💰', 'from-cyan-500 to-blue-600'),
('Social Impact', 'Community building, social innovations, and impact solutions', '🤝', 'from-pink-500 to-rose-600'),
('Others', 'General discussions and topics that don''t fit other categories', '💬', 'from-gray-500 to-gray-600'); 