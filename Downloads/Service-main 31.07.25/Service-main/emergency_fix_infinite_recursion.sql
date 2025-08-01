-- EMERGENCY FIX: Break Infinite Recursion in RLS Policies
-- This addresses the "infinite recursion detected in policy for relation 'profiles'" error

-- Step 1: IMMEDIATELY disable RLS to break the infinite loop
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Clean up ALL existing policies to start fresh
DROP POLICY IF EXISTS "authenticated_users_can_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_users_full_access" ON public.profiles;
DROP POLICY IF EXISTS "admin_users_can_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "temp_allow_authenticated_updates" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;

-- Step 3: Create SIMPLE, non-recursive policies
-- Policy 1: Allow authenticated users to read all profiles (simple, no recursion)
CREATE POLICY "simple_read_access" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to update their own profile only
CREATE POLICY "update_own_profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow authenticated users to insert (for admin user creation)
CREATE POLICY "insert_profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 4: Re-enable RLS with the simplified policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the fix by checking your profile
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    'Profile loaded successfully - recursion fixed!' as status_message
FROM public.profiles 
WHERE id = auth.uid(); 