
-- Test User Presence System
-- Run these queries to test and debug the presence system

-- 1. Check if the table exists and see its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_presence' 
ORDER BY ordinal_position;

-- 2. Check RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'user_presence';

-- 3. Check current user and auth status
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  current_timestamp as current_time;

-- 4. Try to insert a test record (replace with your actual user ID)
-- INSERT INTO user_presence (user_id, is_online, last_seen) 
-- VALUES (auth.uid(), true, now()) 
-- ON CONFLICT (user_id) DO UPDATE SET 
--   is_online = true, 
--   last_seen = now(),
--   updated_at = now();

-- 5. Check all presence records
SELECT 
  id,
  user_id,
  is_online,
  last_seen,
  created_at,
  updated_at
FROM user_presence 
ORDER BY updated_at DESC;

-- 6. Count online users
SELECT get_online_user_count() as online_count;

-- 7. Check if real-time is enabled
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'user_presence';

-- 8. Test the cleanup function
-- SELECT cleanup_inactive_users();

-- 9. Check foreign key constraints
SELECT
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'user_presence';

-- 10. Check for any errors in the table
SELECT 
  user_id,
  COUNT(*) as record_count
FROM user_presence 
GROUP BY user_id 
HAVING COUNT(*) > 1;  -- Should return no rows (each user should have only 1 record) 