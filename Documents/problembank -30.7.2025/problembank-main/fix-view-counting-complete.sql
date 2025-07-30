-- Complete Fix for View Counting System
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS update_problem_views_count_trigger ON problem_views;
DROP FUNCTION IF EXISTS update_problem_views_count();

-- Step 2: Create improved trigger function with better error handling
CREATE OR REPLACE FUNCTION update_problem_views_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the trigger execution for debugging
    RAISE NOTICE 'View count trigger fired: % % for problem %', TG_OP, TG_WHEN, COALESCE(NEW.problem_id, OLD.problem_id);
    
    IF TG_OP = 'INSERT' THEN
        -- Increment view count when new view is added
        UPDATE problems 
        SET views = COALESCE(views, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.problem_id;
        
        -- Log the update
        RAISE NOTICE 'Incremented view count for problem %', NEW.problem_id;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement view count when view is removed (but don't go below 0)
        UPDATE problems 
        SET views = GREATEST(COALESCE(views, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.problem_id;
        
        -- Log the update  
        RAISE NOTICE 'Decremented view count for problem %', OLD.problem_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger
CREATE TRIGGER update_problem_views_count_trigger
    AFTER INSERT OR DELETE ON problem_views
    FOR EACH ROW EXECUTE FUNCTION update_problem_views_count();

-- Step 4: Fix data consistency - sync problems.views with actual problem_views records
UPDATE problems 
SET views = (
    SELECT COUNT(*) 
    FROM problem_views 
    WHERE problem_views.problem_id = problems.id
),
updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT problem_id 
    FROM problem_views
);

-- Step 5: Ensure problems that have no views are set to 0
UPDATE problems 
SET views = 0,
    updated_at = NOW()
WHERE views IS NULL OR views < 0;

-- Step 6: Enable realtime for both tables (if not already enabled)
ALTER publication supabase_realtime ADD TABLE problems;
ALTER publication supabase_realtime ADD TABLE problem_views;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_problem_views_problem_id ON problem_views(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_views_user_id ON problem_views(user_id);
CREATE INDEX IF NOT EXISTS idx_problem_views_created_at ON problem_views(created_at DESC);

-- Step 8: Verify the fix by checking current state
SELECT 
    'Data Consistency Check' as check_type,
    p.id,
    p.title,
    p.views as problems_views_column,
    (SELECT COUNT(*) FROM problem_views pv WHERE pv.problem_id = p.id) as actual_view_records,
    CASE 
        WHEN p.views = (SELECT COUNT(*) FROM problem_views pv WHERE pv.problem_id = p.id) 
        THEN 'CONSISTENT' 
        ELSE 'INCONSISTENT' 
    END as status
FROM problems p
WHERE p.views > 0 OR EXISTS (SELECT 1 FROM problem_views pv WHERE pv.problem_id = p.id)
ORDER BY p.views DESC
LIMIT 10;

-- Step 9: Test the trigger (uncomment to test with a real problem ID)
/*
-- Replace with actual problem ID from your database
DO $$ 
DECLARE
    test_problem_id UUID := 'c662a448-aa05-435a-87a4-4a7a70cafc0d';
    views_before INTEGER;
    views_after INTEGER;
BEGIN
    -- Get current view count
    SELECT views INTO views_before FROM problems WHERE id = test_problem_id;
    RAISE NOTICE 'Views before test: %', views_before;
    
    -- Insert a test view
    INSERT INTO problem_views (problem_id, user_id, ip_address, user_agent) 
    VALUES (test_problem_id, NULL, '192.168.1.1', 'Test-Trigger-Agent');
    
    -- Get view count after
    SELECT views INTO views_after FROM problems WHERE id = test_problem_id;
    RAISE NOTICE 'Views after test: %', views_after;
    
    -- Verify the trigger worked
    IF views_after = views_before + 1 THEN
        RAISE NOTICE 'SUCCESS: Trigger is working correctly!';
    ELSE
        RAISE NOTICE 'FAILED: Trigger did not work. Before: %, After: %', views_before, views_after;
    END IF;
    
    -- Clean up test data
    DELETE FROM problem_views 
    WHERE problem_id = test_problem_id 
    AND ip_address = '192.168.1.1' 
    AND user_agent = 'Test-Trigger-Agent';
    
END $$;
*/

-- Step 10: Grant necessary permissions
GRANT ALL ON problem_views TO anon, authenticated;
GRANT ALL ON problems TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Final verification query
SELECT 
    'Final Status' as status,
    COUNT(*) as total_problems,
    SUM(views) as total_views_column,
    (SELECT COUNT(*) FROM problem_views) as total_view_records
FROM problems; 