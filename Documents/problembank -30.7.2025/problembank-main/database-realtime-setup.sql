-- Real-time Dashboard Setup for Problem Bank
-- This extends the existing database schema with tables for real-time analytics

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES auth.users(id),
    members_count INTEGER DEFAULT 0,
    problems_count INTEGER DEFAULT 0,
    solutions_count INTEGER DEFAULT 0,
    activity_level TEXT DEFAULT 'low' CHECK (activity_level IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    tags TEXT[] DEFAULT '{}'
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'leader')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- Create user_stats table for tracking user performance
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    problems_submitted INTEGER DEFAULT 0,
    solutions_provided INTEGER DEFAULT 0,
    discussions_started INTEGER DEFAULT 0,
    comments_made INTEGER DEFAULT 0,
    votes_received INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    badges TEXT[] DEFAULT '{}'
);

-- Create activity_logs table for tracking all user activities
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('problem_submit', 'solution_submit', 'discussion_create', 'discussion_post', 'vote_cast', 'comment_create', 'team_join', 'team_create', 'achievement_earned')),
    entity_type TEXT CHECK (entity_type IN ('problem', 'solution', 'discussion', 'comment', 'team', 'achievement')),
    entity_id UUID,
    entity_title TEXT,
    points_earned INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('problem_solving', 'collaboration', 'engagement', 'milestone', 'special')),
    points_required INTEGER DEFAULT 0,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('problems_count', 'solutions_count', 'discussions_count', 'points_total', 'streak_days', 'special')),
    condition_value INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    badge_color TEXT DEFAULT '#6366F1'
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- Create online_users table for tracking active users
CREATE TABLE IF NOT EXISTS online_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_online BOOLEAN DEFAULT true,
    current_page TEXT,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('problem_solved', 'solution_voted', 'discussion_reply', 'team_invite', 'achievement_earned', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}'
);

-- Create problem_views table for tracking problem views
CREATE TABLE IF NOT EXISTS problem_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    UNIQUE(problem_id, user_id, session_id)
);

-- Create solution_votes table for tracking solution voting
CREATE TABLE IF NOT EXISTS solution_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    UNIQUE(solution_id, user_id)
);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user stats when activities occur
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
    calculated_streak INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update user stats based on activity type
        IF NEW.activity_type = 'problem_submit' THEN
            UPDATE user_stats 
            SET problems_submitted = problems_submitted + 1,
                total_points = total_points + COALESCE(NEW.points_earned, 0),
                last_activity_at = NOW()
            WHERE user_id = NEW.user_id;
        ELSIF NEW.activity_type = 'solution_submit' THEN
            UPDATE user_stats 
            SET solutions_provided = solutions_provided + 1,
                total_points = total_points + COALESCE(NEW.points_earned, 0),
                last_activity_at = NOW()
            WHERE user_id = NEW.user_id;
        ELSIF NEW.activity_type = 'discussion_create' THEN
            UPDATE user_stats 
            SET discussions_started = discussions_started + 1,
                total_points = total_points + COALESCE(NEW.points_earned, 0),
                last_activity_at = NOW()
            WHERE user_id = NEW.user_id;
        ELSIF NEW.activity_type = 'comment_create' THEN
            UPDATE user_stats 
            SET comments_made = comments_made + 1,
                total_points = total_points + COALESCE(NEW.points_earned, 0),
                last_activity_at = NOW()
            WHERE user_id = NEW.user_id;
        END IF;
        
        -- Calculate and update streak
        calculated_streak := calculate_user_streak(NEW.user_id);
        UPDATE user_stats 
        SET streak_days = calculated_streak
        WHERE user_id = NEW.user_id;
        
        -- Create user_stats record if it doesn't exist
        INSERT INTO user_stats (user_id, total_points, last_activity_at, streak_days)
        VALUES (NEW.user_id, COALESCE(NEW.points_earned, 0), NOW(), calculated_streak)
        ON CONFLICT (user_id) DO NOTHING;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update team stats
CREATE OR REPLACE FUNCTION update_team_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update team member count
        UPDATE teams 
        SET members_count = members_count + 1,
            updated_at = NOW()
        WHERE id = NEW.team_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update team member count
        UPDATE teams 
        SET members_count = members_count - 1,
            updated_at = NOW()
        WHERE id = OLD.team_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to calculate user activity streak
CREATE OR REPLACE FUNCTION calculate_user_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    current_date_check DATE := CURRENT_DATE;
    has_activity BOOLEAN;
BEGIN
    -- Start from today and count backwards
    LOOP
        -- Check if user has any activity on current_date_check
        SELECT EXISTS(
            SELECT 1 FROM activity_logs 
            WHERE user_id = user_id_param 
            AND DATE(created_at) = current_date_check
        ) INTO has_activity;
        
        -- If no activity on this date, break the streak
        IF NOT has_activity THEN
            EXIT;
        END IF;
        
        -- Increment streak and move to previous day
        streak_count := streak_count + 1;
        current_date_check := current_date_check - INTERVAL '1 day';
        
        -- Safety limit to prevent infinite loops
        IF streak_count > 365 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ language 'plpgsql';

-- Function to update problem views
CREATE OR REPLACE FUNCTION update_problem_views()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update problem views count
        UPDATE problems 
        SET views = views + 1,
            updated_at = NOW()
        WHERE id = NEW.problem_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update solution votes
CREATE OR REPLACE FUNCTION update_solution_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update solution votes count
        UPDATE solutions 
        SET votes = votes + (CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE -1 END),
            updated_at = NOW()
        WHERE id = NEW.solution_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update solution votes count
        UPDATE solutions 
        SET votes = votes - (CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE -1 END),
            updated_at = NOW()
        WHERE id = OLD.solution_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to recalculate streaks for all users
CREATE OR REPLACE FUNCTION recalculate_all_streaks()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    calculated_streak INTEGER;
BEGIN
    -- Loop through all users in user_stats
    FOR user_record IN 
        SELECT DISTINCT user_id FROM user_stats
    LOOP
        -- Calculate streak for this user
        calculated_streak := calculate_user_streak(user_record.user_id);
        
        -- Update user_stats table
        UPDATE user_stats 
        SET streak_days = calculated_streak
        WHERE user_id = user_record.user_id;
        
        -- Also update user_profiles table if it exists
        UPDATE user_profiles 
        SET streak_days = calculated_streak
        WHERE id = user_record.user_id;
    END LOOP;
    
    RAISE NOTICE 'Recalculated streaks for all users';
END;
$$ language 'plpgsql';

-- Run the recalculation for existing users
SELECT recalculate_all_streaks();

-- Create triggers
CREATE TRIGGER update_user_stats_trigger
    AFTER INSERT ON activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_team_stats_trigger
    AFTER INSERT OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_team_stats();

CREATE TRIGGER update_problem_views_trigger
    AFTER INSERT ON problem_views
    FOR EACH ROW EXECUTE FUNCTION update_problem_views();

CREATE TRIGGER update_solution_votes_trigger
    AFTER INSERT OR DELETE ON solution_votes
    FOR EACH ROW EXECUTE FUNCTION update_solution_votes();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_online_users_user_id ON online_users(user_id);
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_problem_views_problem_id ON problem_views(problem_id);
CREATE INDEX IF NOT EXISTS idx_solution_votes_solution_id ON solution_votes(solution_id);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, condition_type, condition_value, points_required) VALUES
('First Problem', 'Submit your first problem', '🎯', 'milestone', 'problems_count', 1, 0),
('Problem Solver', 'Submit 10 problems', '🏆', 'problem_solving', 'problems_count', 10, 0),
('Solution Master', 'Provide 5 solutions', '💡', 'problem_solving', 'solutions_count', 5, 0),
('Collaborator', 'Start 3 discussions', '🤝', 'collaboration', 'discussions_count', 3, 0),
('Point Collector', 'Earn 1000 points', '⭐', 'milestone', 'points_total', 1000, 0),
('Streak Champion', 'Maintain 7-day streak', '🔥', 'engagement', 'streak_days', 7, 0),
('Innovation Leader', 'Top contributor badge', '👑', 'special', 'special', 0, 0)
ON CONFLICT (name) DO NOTHING;

-- Insert sample teams
INSERT INTO teams (name, description, activity_level) VALUES
('Tech Innovators', 'Focused on technology and innovation solutions', 'high'),
('Healthcare Heroes', 'Dedicated to healthcare and medical solutions', 'medium'),
('Green Solutions', 'Environmental and sustainability focus', 'high'),
('Edu Reformers', 'Education and learning improvement', 'low')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Team members can view their teams" ON team_members FOR SELECT USING (true);
CREATE POLICY "Users can view their own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view activity logs" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);
CREATE POLICY "User achievements are viewable by everyone" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Online users are viewable by everyone" ON online_users FOR SELECT USING (true);
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Problem views are viewable by everyone" ON problem_views FOR SELECT USING (true);
CREATE POLICY "Solution votes are viewable by everyone" ON solution_votes FOR SELECT USING (true);

-- Create insert policies
CREATE POLICY "Authenticated users can insert activity logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert problem views" ON problem_views FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Authenticated users can insert solution votes" ON solution_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert team members" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Create update policies
CREATE POLICY "Users can update their own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their online status" ON online_users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create delete policies
CREATE POLICY "Users can delete their team memberships" ON team_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their solution votes" ON solution_votes FOR DELETE USING (auth.uid() = user_id); 