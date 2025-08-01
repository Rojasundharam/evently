-- Fix RLS Policies for User Management
-- This addresses the 406 error when updating user roles

-- First, let's drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.profiles;

-- Create simplified, working RLS policies
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "authenticated_users_can_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_users_full_access" ON public.profiles;
DROP POLICY IF EXISTS "admin_users_can_insert_profiles" ON public.profiles;

-- Policy 1: Allow authenticated users to read profiles
CREATE POLICY "authenticated_users_can_read_profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow admin users to perform all operations on all profiles
CREATE POLICY "admin_users_full_access" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy 4: Allow admin users to insert new profiles (for user creation)
CREATE POLICY "admin_users_can_insert_profiles" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a function to check if current user is admin (more reliable)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Create a more permissive policy for testing
-- Uncomment this if you need to test without admin restrictions
-- CREATE POLICY "temp_allow_all_updates" ON public.profiles
--     FOR UPDATE USING (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Check current user's role (for debugging)
-- You can run this to verify your current user's role:
-- SELECT id, email, role FROM public.profiles WHERE id = auth.uid(); 