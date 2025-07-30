-- Add star and view tracking features to Problem Bank

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
        SET views = views + 1 
        WHERE id = NEW.problem_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE problems 
        SET views = views - 1 
        WHERE id = OLD.problem_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update views count
CREATE TRIGGER update_problem_views_count_trigger
    AFTER INSERT OR DELETE ON problem_views
    FOR EACH ROW EXECUTE FUNCTION update_problem_views_count();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_problem_stars_user_id ON problem_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_stars_problem_id ON problem_stars(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_views_user_id ON problem_views(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_views_problem_id ON problem_views(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_views_created_at ON problem_views(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE problem_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for problem_stars (users can only see their own stars)
CREATE POLICY "Users can view their own stars" ON problem_stars
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stars" ON problem_stars
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stars" ON problem_stars
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for problem_views (users can only see their own views, but views count is public)
CREATE POLICY "Users can view their own views" ON problem_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own views" ON problem_views
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Grant permissions
GRANT ALL ON problem_stars TO anon, authenticated;
GRANT ALL ON problem_views TO anon, authenticated; 