-- QUICK FIX for 406 Error when updating user roles
-- This focuses on the immediate issue

-- Step 1: Check your current role (run this first)
SELECT 
    id,
    email, 
    role,
    'Current user role: ' || COALESCE(role, 'NULL') as status
FROM public.profiles 
WHERE id = auth.uid();

-- Step 2: Make yourself admin (replace with your actual email)
-- IMPORTANT: Replace 'your-email@example.com' with your actual email address
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Step 3: Create a temporary policy to allow updates (for testing)
DROP POLICY IF EXISTS "temp_allow_authenticated_updates" ON public.profiles;
CREATE POLICY "temp_allow_authenticated_updates" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Step 4: Verify the fix worked
SELECT 
    id,
    email,
    role,
    'Updated role: ' || role as status
FROM public.profiles 
WHERE id = auth.uid();

-- IMPORTANT: After testing, remove the temporary policy and use proper admin-only policy:
-- DROP POLICY IF EXISTS "temp_allow_authenticated_updates" ON public.profiles; 