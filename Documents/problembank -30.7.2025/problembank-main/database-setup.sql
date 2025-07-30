-- Database setup for Problem Bank real-time system
-- Run this in your Supabase SQL editor

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technology', 'healthcare', 'education', 'environment', 'finance', 'social')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    tags TEXT[] DEFAULT '{}',
    deadline DATE,
    resources TEXT,
    criteria TEXT,
    test_cases JSONB DEFAULT '[]',
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'solved')),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    solutions_count INTEGER DEFAULT 0
);

-- Create solutions table
CREATE TABLE IF NOT EXISTS solutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'accepted')),
    votes INTEGER DEFAULT 0,
    attachments TEXT[] DEFAULT '{}'
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    likes INTEGER DEFAULT 0
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
    UNIQUE(user_id, solution_id),
    UNIQUE(user_id, problem_id)
);

-- Create discussion categories table
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

-- Create discussions table (threads)
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id UUID REFERENCES discussion_categories(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    author_avatar TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pinned')),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_post_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_post_author TEXT,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}'
);

-- Create discussion posts table (replies)
CREATE TABLE IF NOT EXISTS discussion_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    author_name TEXT,
    author_avatar TEXT,
    likes INTEGER DEFAULT 0,
    is_solution BOOLEAN DEFAULT false
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON solutions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_categories_updated_at BEFORE UPDATE ON discussion_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON discussions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_posts_updated_at BEFORE UPDATE ON discussion_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update solutions count
CREATE OR REPLACE FUNCTION update_solutions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE problems 
        SET solutions_count = solutions_count + 1 
        WHERE id = NEW.problem_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE problems 
        SET solutions_count = solutions_count - 1 
        WHERE id = OLD.problem_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create function to update discussion post counts and activity
CREATE OR REPLACE FUNCTION update_discussion_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update discussion post count and last activity
        UPDATE discussions 
        SET post_count = post_count + 1,
            last_post_at = NEW.created_at,
            last_post_author = NEW.author_name
        WHERE id = NEW.discussion_id;
        
        -- Update category post count
        UPDATE discussion_categories 
        SET post_count = post_count + 1 
        WHERE id = (SELECT category_id FROM discussions WHERE id = NEW.discussion_id);
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update discussion post count
        UPDATE discussions 
        SET post_count = post_count - 1 
        WHERE id = OLD.discussion_id;
        
        -- Update category post count
        UPDATE discussion_categories 
        SET post_count = post_count - 1 
        WHERE id = (SELECT category_id FROM discussions WHERE id = OLD.discussion_id);
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create function to update discussion thread counts
CREATE OR REPLACE FUNCTION update_discussion_thread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE discussion_categories 
        SET thread_count = thread_count + 1 
        WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE discussion_categories 
        SET thread_count = thread_count - 1 
        WHERE id = OLD.category_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for solutions count
CREATE TRIGGER update_solutions_count_trigger
    AFTER INSERT OR DELETE ON solutions
    FOR EACH ROW EXECUTE FUNCTION update_solutions_count();

-- Create triggers for discussion activity
CREATE TRIGGER update_discussion_activity_trigger
    AFTER INSERT OR DELETE ON discussion_posts
    FOR EACH ROW EXECUTE FUNCTION update_discussion_activity();

CREATE TRIGGER update_discussion_thread_count_trigger
    AFTER INSERT OR DELETE ON discussions
    FOR EACH ROW EXECUTE FUNCTION update_discussion_thread_count();

-- Enable Row Level Security (RLS)
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for problems (everyone can read and insert)
CREATE POLICY "Anyone can view problems" ON problems
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert problems" ON problems
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own problems" ON problems
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NULL);

-- Create policies for solutions
CREATE POLICY "Anyone can view solutions" ON solutions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert solutions" ON solutions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own solutions" ON solutions
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NULL);

-- Create policies for comments
CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert comments" ON comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NULL);

-- Create policies for votes (still require auth for voting to prevent spam)
CREATE POLICY "Users can view all votes" ON votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert votes" ON votes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for discussion categories
CREATE POLICY "Anyone can view discussion categories" ON discussion_categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage discussion categories" ON discussion_categories
    FOR ALL USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin'));

-- Create policies for discussions
CREATE POLICY "Anyone can view discussions" ON discussions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert discussions" ON discussions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own discussions" ON discussions
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NULL);

-- Create policies for discussion posts
CREATE POLICY "Anyone can view discussion posts" ON discussion_posts
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert discussion posts" ON discussion_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own discussion posts" ON discussion_posts
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_comments_problem_id ON comments(problem_id);
CREATE INDEX IF NOT EXISTS idx_comments_solution_id ON comments(solution_id);
CREATE INDEX IF NOT EXISTS idx_votes_solution_id ON votes(solution_id);
CREATE INDEX IF NOT EXISTS idx_votes_problem_id ON votes(problem_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category_id ON discussions(category_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_last_post_at ON discussions(last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_discussion_id ON discussion_posts(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_created_at ON discussion_posts(created_at DESC);

-- Insert discussion categories
INSERT INTO discussion_categories (name, description, icon, color, sort_order) VALUES 
('Technology', 'Tech innovations and digital solutions', '💻', 'from-blue-500 to-indigo-600', 1),
('Healthcare', 'Medical innovations and health tech', '🏥', 'from-green-500 to-emerald-600', 2),
('Education', 'Educational technology and learning methods', '📚', 'from-yellow-500 to-orange-600', 3),
('Environment', 'Sustainability and environmental initiatives', '🌱', 'from-purple-500 to-pink-600', 4),
('Finance', 'Fintech and financial innovations', '💰', 'from-cyan-500 to-blue-600', 5),
('Social Impact', 'Community building and social innovations', '🤝', 'from-pink-500 to-rose-600', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert some sample data (optional)
INSERT INTO problems (title, description, category, difficulty, tags, author_name) VALUES 
('AI-Powered Healthcare Diagnostic System', 
 'I need help developing an AI system that can analyze medical images and provide preliminary diagnostic suggestions to healthcare professionals. My goal is to create a tool that assists doctors in identifying potential issues faster and more accurately.',
 'healthcare', 
 'expert', 
 ARRAY['ai', 'machine-learning', 'healthcare', 'diagnostics'], 
 'Dr. Sarah Chen'),

('Sustainable Urban Transportation Network', 
 'I am working on designing a comprehensive transportation system that reduces carbon emissions while improving mobility in dense urban areas. My challenge is to balance efficiency, sustainability, and cost-effectiveness.',
 'environment', 
 'advanced', 
 ARRAY['sustainability', 'transportation', 'urban-planning'], 
 'Mike Johnson'),

('Real-time Collaborative Learning Platform', 
 'I want to create adaptive learning algorithms that personalize educational content based on individual learning patterns and preferences. My aim is to make learning more engaging and effective for students.',
 'education', 
 'intermediate', 
 ARRAY['edtech', 'ai', 'personalization', 'learning'], 
 'Emma Wilson');

-- Insert sample discussions
INSERT INTO discussions (title, content, category_id, author_name, author_avatar, tags) VALUES 
('Best practices for implementing AI in medical diagnostics',
 'I''m currently working on an AI diagnostic tool and would love to hear from others about the best practices, ethical considerations, and technical challenges you''ve encountered.',
 (SELECT id FROM discussion_categories WHERE name = 'Healthcare'),
 'Dr. Sarah Chen',
 '👩‍⚕️',
 ARRAY['ai', 'medical', 'best-practices']),

('Sustainable transportation solutions for smart cities',
 'What are the most promising technologies for creating eco-friendly urban transportation networks? I''m particularly interested in integration challenges and real-world implementations.',
 (SELECT id FROM discussion_categories WHERE name = 'Environment'),
 'Mike Johnson',
 '👨‍💻',
 ARRAY['smart-cities', 'transportation', 'sustainability']),

('Personalized learning algorithms: Share your experiences',
 'I''ve been experimenting with adaptive learning systems. What approaches have worked best for you in creating truly personalized educational experiences?',
 (SELECT id FROM discussion_categories WHERE name = 'Education'),
 'Emma Wilson',
 '👩‍🏫',
 ARRAY['edtech', 'personalization', 'algorithms']);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE problems;
ALTER PUBLICATION supabase_realtime ADD TABLE solutions;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE discussions;
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_posts; 