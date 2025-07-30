-- Fix RLS policies to allow anonymous users to submit problems
-- Run this in your Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert problems" ON problems;
DROP POLICY IF EXISTS "Users can update their own problems" ON problems;
DROP POLICY IF EXISTS "Authenticated users can insert solutions" ON solutions;
DROP POLICY IF EXISTS "Users can update their own solutions" ON solutions;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own votes" ON votes;

-- Create new policies that allow anonymous users
CREATE POLICY "Anyone can insert problems" ON problems
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own problems" ON problems
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NULL);

CREATE POLICY "Anyone can insert solutions" ON solutions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own solutions" ON solutions
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NULL);

CREATE POLICY "Anyone can insert comments" ON comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = author_id OR auth.uid() IS NULL);

-- Keep voting restricted to authenticated users to prevent spam
CREATE POLICY "Authenticated users can insert votes" ON votes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 