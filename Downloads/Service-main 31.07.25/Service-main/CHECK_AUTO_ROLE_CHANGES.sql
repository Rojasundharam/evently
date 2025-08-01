-- CHECK WHY ROLES ARE AUTOMATICALLY CHANGING
-- Run this to find triggers, functions, or policies causing automatic role changes

-- 1. Check for triggers on profiles table
SELECT 
    '=== TRIGGERS ON PROFILES TABLE ===' as section,
    trigger_name,
    event_manipulation as trigger_event,
    action_timing as when_triggered,
    action_statement as trigger_function
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 2. Check for triggers on auth.users table (affects profile creation/updates)
SELECT 
    '=== TRIGGERS ON AUTH.USERS TABLE ===' as section,
    trigger_name,
    event_manipulation as trigger_event,
    action_timing as when_triggered,
    action_statement as trigger_function
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;

-- 3. Check specific functions that might be resetting roles
SELECT 
    '=== FUNCTIONS THAT MIGHT RESET ROLES ===' as section,
    routine_name as function_name,
    routine_definition as function_code
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
    routine_definition ILIKE '%role%' 
    OR routine_definition ILIKE '%student%'
    OR routine_definition ILIKE '%admin%'
    OR routine_name ILIKE '%user%'
    OR routine_name ILIKE '%profile%'
)
ORDER BY routine_name;

-- 4. Check for any policies that might be affecting updates
SELECT 
    '=== UPDATE POLICIES ON PROFILES ===' as section,
    policyname as policy_name,
    qual as policy_condition,
    with_check as policy_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'UPDATE'
ORDER BY policyname;

-- 5. Check for any scheduled jobs or cron jobs (if cron extension exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN
        PERFORM 1; -- Cron extension exists, but we'll skip detailed check
        RAISE NOTICE 'Cron extension is available (but usually not the cause of role changes)';
    ELSE
        RAISE NOTICE 'No cron extension found (this is normal for most Supabase projects)';
    END IF;
END $$;

-- 6. Check recent updates to see what's changing roles
SELECT 
    '=== RECENT ROLE CHANGES ===' as section,
    email,
    role,
    updated_at,
    'Role may be getting reset by a trigger' as note
FROM public.profiles 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 10;

-- 7. Look for the specific handle_new_user function
SELECT 
    '=== HANDLE_NEW_USER FUNCTION ===' as section,
    routine_definition as function_code
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public'; 