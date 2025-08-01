-- Fix User Visibility Issues - Remove Recursive RLS Policies
-- This fixes the issue where some users are not visible due to recursive RLS queries

-- Step 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;

-- Step 2: Create simple, non-recursive RLS policies
-- Allow all authenticated users to read all profiles (for user management)
CREATE POLICY "Allow authenticated users to read all profiles" ON public.profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- Allow users to insert their own profile (for new user creation)
CREATE POLICY "Allow users to insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Step 3: Create a function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM auth.users u
        JOIN public.profiles p ON u.id = p.id
        WHERE u.id = auth.uid() 
        AND p.role = 'admin'
    );
$$;

-- Step 4: Create admin policy using the function (non-recursive)
CREATE POLICY "Allow admin users to manage all profiles" ON public.profiles
    FOR ALL 
    USING (public.is_admin_user());

-- Step 5: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Step 6: Verify the fix
DO $$
DECLARE
    total_users INTEGER;
    visible_users INTEGER;
BEGIN
    -- Get total users in auth.users
    SELECT COUNT(*) INTO total_users FROM auth.users;
    
    -- Get total visible profiles
    SELECT COUNT(*) INTO visible_users FROM public.profiles;
    
    RAISE NOTICE 'Total auth users: %, Visible profiles: %', total_users, visible_users;
    
    -- List all users for debugging
    RAISE NOTICE 'Users in profiles table:';
    FOR rec IN 
        SELECT email, role, status 
        FROM public.profiles 
        ORDER BY created_at
    LOOP
        RAISE NOTICE 'User: %, Role: %, Status: %', rec.email, rec.role, rec.status;
    END LOOP;
END $$; 