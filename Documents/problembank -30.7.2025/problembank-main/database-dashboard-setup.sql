-- Database Dashboard Setup - Missing Tables
-- Run this in your Supabase SQL editor to create missing tables for dashboard functionality

-- Create user_stats table for tracking user statistics
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_points INTEGER DEFAULT 0,
    problems_submitted INTEGER DEFAULT 0,
    solutions_provided INTEGER DEFAULT 0,
    discussions_started INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table for tracking user activities
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'problem_submit', 'solution_submit', 'discussion_create', 'discussion_post',
        'vote_cast', 'comment_create', 'team_join', 'team_create', 'achievement_earned'
    )),
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'problem', 'solution', 'discussion', 'comment', 'vote', 'team', 'achievement'
    )),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    points_earned INTEGER DEFAULT 0
);

-- Create online_users table for tracking active users
CREATE TABLE IF NOT EXISTS online_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_online BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'offline')),
    current_page TEXT,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table for team functionality
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    is_public BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 10,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Create team_members table for team membership
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'left')),
    UNIQUE(team_id, user_id)
);

-- Create functions to update stats automatically
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user stats based on activity
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_stats (user_id, total_points, last_activity)
        VALUES (NEW.user_id, COALESCE(NEW.points_earned, 0), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            total_points = user_stats.total_points + COALESCE(NEW.points_earned, 0),
            last_activity = NOW();
        
        -- Update specific counters based on activity type
        IF NEW.activity_type = 'problem_submit' THEN
            UPDATE user_stats 
            SET problems_submitted = problems_submitted + 1,
                xp = xp + 50
            WHERE user_id = NEW.user_id;
        ELSIF NEW.activity_type = 'solution_submit' THEN
            UPDATE user_stats 
            SET solutions_provided = solutions_provided + 1,
                xp = xp + 30
            WHERE user_id = NEW.user_id;
        ELSIF NEW.activity_type = 'discussion_create' THEN
            UPDATE user_stats 
            SET discussions_started = discussions_started + 1,
                xp = xp + 10
            WHERE user_id = NEW.user_id;
        END IF;
        
        -- Update level based on XP
        UPDATE user_stats 
        SET level = FLOOR(xp / 100) + 1
        WHERE user_id = NEW.user_id;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update online status
CREATE OR REPLACE FUNCTION update_online_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO online_users (user_id, last_seen, is_online)
    VALUES (NEW.user_id, NOW(), true)
    ON CONFLICT (user_id) DO UPDATE SET
        last_seen = NOW(),
        is_online = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate user rankings
CREATE OR REPLACE FUNCTION update_user_rankings()
RETURNS void AS $$
BEGIN
    -- Update rankings based on total points
    UPDATE user_stats 
    SET rank = ranking.rank
    FROM (
        SELECT user_id, 
               ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
        FROM user_stats
    ) ranking
    WHERE user_stats.user_id = ranking.user_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_user_stats_trigger
    AFTER INSERT ON activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_online_status_trigger
    AFTER INSERT ON activity_logs
    FOR EACH ROW EXECUTE FUNCTION update_online_status();

-- Create triggers for updated_at
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stats
CREATE POLICY "Users can view all stats" ON user_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert stats" ON user_stats
    FOR INSERT WITH CHECK (true);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view all activity" ON activity_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own activity" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for online_users
CREATE POLICY "Users can view online status" ON online_users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own status" ON online_users
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for teams
CREATE POLICY "Users can view public teams" ON teams
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners can update teams" ON teams
    FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for team_members
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Users can join teams" ON team_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON team_members
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(level);
CREATE INDEX IF NOT EXISTS idx_user_stats_rank ON user_stats(rank);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);

CREATE INDEX IF NOT EXISTS idx_online_users_user_id ON online_users(user_id);
CREATE INDEX IF NOT EXISTS idx_online_users_is_online ON online_users(is_online);
CREATE INDEX IF NOT EXISTS idx_online_users_last_seen ON online_users(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_is_public ON teams(is_public);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Initialize user stats for existing users
INSERT INTO user_stats (user_id, total_points, problems_submitted, solutions_provided, discussions_started)
SELECT 
    up.id,
    COALESCE(up.problems_submitted * 50, 0) + COALESCE(up.solutions_posted * 30, 0) + COALESCE(up.total_votes_received * 5, 0) as total_points,
    COALESCE(up.problems_submitted, 0),
    COALESCE(up.solutions_posted, 0),
    0 as discussions_started
FROM user_profiles up
WHERE up.id NOT IN (SELECT user_id FROM user_stats)
ON CONFLICT (user_id) DO NOTHING;

-- Update rankings for all users
SELECT update_user_rankings();

-- Insert sample activity for demonstration
INSERT INTO activity_logs (user_id, activity_type, entity_type, entity_id, points_earned)
SELECT 
    author_id, 
    'problem_submit', 
    'problem', 
    id, 
    50
FROM problems 
WHERE author_id IS NOT NULL 
AND author_id NOT IN (
    SELECT user_id FROM activity_logs WHERE activity_type = 'problem_submit'
);

INSERT INTO activity_logs (user_id, activity_type, entity_type, entity_id, points_earned)
SELECT 
    author_id, 
    'solution_submit', 
    'solution', 
    id, 
    30
FROM solutions 
WHERE author_id IS NOT NULL 
AND author_id NOT IN (
    SELECT user_id FROM activity_logs WHERE activity_type = 'solution_submit'
);

-- Add online status for active users
INSERT INTO online_users (user_id, last_seen, is_online)
SELECT 
    id, 
    last_active, 
    (last_active > NOW() - INTERVAL '15 minutes') as is_online
FROM user_profiles 
WHERE last_active IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
    last_seen = EXCLUDED.last_seen,
    is_online = EXCLUDED.is_online; 