-- Debug Current User Role and Permissions
-- Run this in Supabase SQL Editor to understand the current state

-- 1. Check your current user's profile
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- 2. Check if you have admin role
SELECT 
    CASE 
        WHEN role = 'admin' THEN 'YES - You have admin access'
        ELSE 'NO - You do not have admin access (role: ' || role || ')'
    END as admin_status
FROM public.profiles 
WHERE id = auth.uid();

-- 3. Check all existing policies on profiles table
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
WHERE tablename = 'profiles';

-- 4. Check current auth info
SELECT 
    auth.uid() as user_id,
    auth.role() as auth_role,
    auth.email() as email;

-- 5. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 6. Test permissions (this will help identify the issue)
SELECT 
    has_table_privilege('public.profiles', 'SELECT') as can_select,
    has_table_privilege('public.profiles', 'UPDATE') as can_update,
    has_table_privilege('public.profiles', 'INSERT') as can_insert,
    has_table_privilege('public.profiles', 'DELETE') as can_delete; 