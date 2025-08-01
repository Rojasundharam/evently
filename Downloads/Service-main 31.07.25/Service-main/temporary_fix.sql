-- TEMPORARY FIX - Allow updates for testing
-- Use this ONLY for testing/development, remove for production

-- Option 1: Temporarily allow all authenticated users to update profiles
-- (Remove this once you have proper admin access)
CREATE POLICY "temp_allow_authenticated_updates" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Option 2: Make yourself an admin if you're the first user
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Option 3: Alternative - temporarily disable RLS (NOT recommended for production)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- To clean up later, run:
-- DROP POLICY IF EXISTS "temp_allow_authenticated_updates" ON public.profiles;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 