-- QUICK FIX: User Visibility Issues in User Management
-- Run this in your Supabase SQL Editor to immediately fix the problem

-- 1. First, let's see what's in the auth.users vs profiles table
SELECT 'Auth Users Count' as type, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Profiles Count' as type, COUNT(*) as count FROM public.profiles;

-- 2. Check for missing profiles (users in auth.users but not in profiles)
SELECT 
    'Missing Profiles' as issue,
    u.email,
    u.id,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 3. Create missing profiles for auth users that don't have them
INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', ''),
    'student', -- Default role
    'active',  -- Default status
    u.created_at,
    NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Fix the RLS policies (remove recursive ones)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;

-- 5. Create simple, working RLS policies
CREATE POLICY "Allow all authenticated users to read profiles" ON public.profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- 6. Verify the fix
SELECT 
    'After Fix - Auth Users' as type, 
    COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
    'After Fix - Profiles' as type, 
    COUNT(*) as count 
FROM public.profiles;

-- 7. List all profiles to confirm they're all visible
SELECT 
    email,
    full_name,
    role,
    status,
    created_at
FROM public.profiles
ORDER BY created_at; 