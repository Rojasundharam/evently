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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('problem_reply', 'leaderboard_update', 'product_announcement', 'solution_posted', 'discussion_reply')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

-- Update existing tables to include user references
ALTER TABLE problems 
    ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ai_solution_visible_to UUID REFERENCES auth.users(id);

ALTER TABLE solutions 
    ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_categories_updated_at BEFORE UPDATE ON discussion_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_threads_updated_at BEFORE UPDATE ON discussion_threads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_posts_updated_at BEFORE UPDATE ON discussion_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
    
    INSERT INTO user_preferences (id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to update thread reply count
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE discussion_threads 
        SET replies_count = replies_count + 1,
            last_reply_at = NOW()
        WHERE id = NEW.thread_id;
        
        UPDATE discussion_categories 
        SET post_count = post_count + 1
        WHERE id = (SELECT category_id FROM discussion_threads WHERE id = NEW.thread_id);
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE discussion_threads 
        SET replies_count = replies_count - 1
        WHERE id = OLD.thread_id;
        
        UPDATE discussion_categories 
        SET post_count = post_count - 1
        WHERE id = (SELECT category_id FROM discussion_threads WHERE id = OLD.thread_id);
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for thread reply count
CREATE TRIGGER update_thread_reply_count_trigger
    AFTER INSERT OR DELETE ON discussion_posts
    FOR EACH ROW EXECUTE FUNCTION update_thread_reply_count();

-- Enable RLS for new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = id);

-- RLS Policies for discussion_categories
CREATE POLICY "Anyone can view categories" ON discussion_categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON discussion_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for discussion_threads
CREATE POLICY "Anyone can view threads" ON discussion_threads
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create threads" ON discussion_threads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own threads" ON discussion_threads
    FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for discussion_posts
CREATE POLICY "Anyone can view posts" ON discussion_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON discussion_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own posts" ON discussion_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default discussion categories
INSERT INTO discussion_categories (name, description, icon, color) VALUES 
('Technology', 'Discuss tech innovations, programming, and digital solutions', '💻', 'from-blue-500 to-indigo-600'),
('Healthcare', 'Medical innovations, health tech, and healthcare solutions', '🏥', 'from-green-500 to-emerald-600'),
('Education', 'Educational technology, learning methods, and academic discussions', '📚', 'from-yellow-500 to-orange-600'),
('Environment', 'Sustainability, climate solutions, and environmental initiatives', '🌱', 'from-purple-500 to-pink-600'),
('Finance', 'Fintech, economic solutions, and financial innovations', '💰', 'from-cyan-500 to-blue-600'),
('Social Impact', 'Community building, social innovations, and impact solutions', '🤝', 'from-pink-500 to-rose-600'),
('Others', 'General discussions and topics that don''t fit other categories', '💬', 'from-gray-500 to-gray-600');

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_category ON discussion_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_thread ON discussion_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action); 