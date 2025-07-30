-- Add media_urls column to discussions table
-- This fixes the error: "Could not find the 'media_urls' column of 'discussions' in the schema cache"

-- Add media_urls column to discussions table
ALTER TABLE discussions 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

-- Update RLS policies if needed
-- Ensure existing policies work with the new column

-- Add comment explaining the column
COMMENT ON COLUMN discussions.media_urls IS 'Array of media file URLs attached to the discussion thread';