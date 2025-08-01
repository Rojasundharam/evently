-- SIMPLE ADMIN FIX - No complex functions, just direct commands
-- Run this in Supabase SQL Editor

-- Step 1: Temporarily disable RLS to bypass restrictions
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Make yourself admin (replace email with your actual email)
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'sroja@jkkn.ac.in';

-- Step 3: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the change worked
SELECT 
    'SUCCESS!' as status,
    email,
    role,
    'You can now edit roles in Table Editor' as message
FROM public.profiles 
WHERE email = 'sroja@jkkn.ac.in';

-- Step 5: Show all users to confirm admin access
SELECT 
    'All Users (Admin View)' as section,
    email,
    role,
    status,
    created_at
FROM public.profiles 
ORDER BY created_at DESC; 