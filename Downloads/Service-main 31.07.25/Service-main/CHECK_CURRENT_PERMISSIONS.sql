-- Check Current User Permissions and Role
-- Run this in Supabase SQL Editor to see why you can't edit roles

-- 1. Check your current user's profile and permissions
SELECT 
    '=== YOUR CURRENT USER INFO ===' as section,
    id,
    email,
    full_name,
    role as current_role,
    status,
    created_at
FROM public.profiles 
WHERE id = auth.uid();

-- 2. Check your authentication status
SELECT 
    '=== AUTH INFO ===' as section,
    auth.uid() as user_id,
    auth.role() as auth_role,
    auth.email() as email;

-- 3. Check if you can see all users (indicates admin access)
SELECT 
    '=== ALL USERS (Admin View) ===' as section,
    email,
    role,
    status,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check active RLS policies
SELECT 
    '=== ACTIVE POLICIES ===' as section,
    policyname as policy_name,
    cmd as command_type,
    CASE 
        WHEN cmd = 'UPDATE' THEN 'UPDATE POLICY'
        WHEN cmd = 'SELECT' THEN 'READ POLICY'
        WHEN cmd = 'INSERT' THEN 'INSERT POLICY'
        WHEN cmd = 'ALL' THEN 'ALL OPERATIONS'
        ELSE cmd
    END as policy_description
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Test if you can update profiles (this will show the exact error)
DO $$
BEGIN
    -- Try to update a test field on your own profile
    UPDATE public.profiles 
    SET updated_at = NOW() 
    WHERE id = auth.uid();
    
    RAISE NOTICE 'SUCCESS: You can update your own profile';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR updating profile: %', SQLERRM;
END $$;

-- 6. Check table permissions
SELECT 
    '=== TABLE PERMISSIONS ===' as section,
    has_table_privilege('public.profiles', 'SELECT') as can_read,
    has_table_privilege('public.profiles', 'UPDATE') as can_update,
    has_table_privilege('public.profiles', 'INSERT') as can_insert,
    has_table_privilege('public.profiles', 'DELETE') as can_delete; 