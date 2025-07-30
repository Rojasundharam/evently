-- Add media_urls column to discussion_posts table
-- This fixes the error: "Could not find the 'media_urls' column of 'discussion_posts' in the schema cache"

-- Add media_urls column to discussion_posts table
ALTER TABLE discussion_posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

-- Update RLS policies to include the new column
-- Make sure all users can insert/update media_urls
DROP POLICY IF EXISTS "discussion_posts_insert_policy" ON discussion_posts;
CREATE POLICY "discussion_posts_insert_policy" ON discussion_posts
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "discussion_posts_update_policy" ON discussion_posts;
CREATE POLICY "discussion_posts_update_policy" ON discussion_posts
FOR UPDATE
USING (author_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
));

-- Ensure RLS is enabled
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- Add comment explaining the column
COMMENT ON COLUMN discussion_posts.media_urls IS 'Array of media file URLs attached to the post';