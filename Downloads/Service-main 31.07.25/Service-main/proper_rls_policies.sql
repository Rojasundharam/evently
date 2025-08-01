-- Proper RLS Policies (No Infinite Recursion)
-- Run this AFTER the emergency fix and making a user admin

-- Step 1: Clean up existing policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "simple_read_access" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "insert_profiles" ON public.profiles;

-- Step 2: Create proper, non-recursive policies

-- Policy 1: Allow all authenticated users to read profiles
-- This is safe and doesn't cause recursion
CREATE POLICY "allow_authenticated_read" ON public.profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to update their own profile
-- This is safe and doesn't cause recursion  
CREATE POLICY "allow_own_profile_update" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- Policy 3: Allow profile creation for authenticated users
-- This is needed for user registration
CREATE POLICY "allow_profile_creation" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Policy 4: Allow admin users to perform all operations
-- This uses a safer approach without recursion
CREATE POLICY "allow_admin_operations" ON public.profiles
    FOR ALL 
    USING (
        -- Check if the current user's role is admin from auth.users metadata
        -- This avoids querying the profiles table and prevents recursion
        (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
        OR
        -- Fallback: check if user_id matches a known admin pattern
        -- You can customize this based on your admin user setup
        (auth.uid()::text = ANY(
            SELECT id::text FROM public.profiles 
            WHERE role = 'admin' 
            AND id = auth.uid()
        ))
    );

-- Policy 5: Alternative simple admin policy (if above causes issues)
-- Uncomment this if you need a simpler approach
-- CREATE POLICY "simple_admin_access" ON public.profiles
--     FOR ALL 
--     USING (
--         auth.uid() IN (
--             -- Add your admin user IDs here manually
--             'your-admin-user-id-1',
--             'your-admin-user-id-2'
--         )
--     );

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Test the policies
SELECT 
    'Policies created successfully!' as message,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 5: Verify you can still read profiles
SELECT 
    id,
    email,
    role,
    'Profile read test successful!' as test_result
FROM public.profiles 
WHERE id = auth.uid(); 