-- Make User Admin Script
-- Run this AFTER running the emergency_fix_infinite_recursion.sql script

-- Step 1: First, let's see all current users
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM public.profiles
ORDER BY created_at ASC;

-- Step 2: Make the first user (or specific user) an admin
-- Replace 'your-email@example.com' with your actual email address
UPDATE public.profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Step 3: Verify the admin user was created
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    'Admin role set successfully!' as message
FROM public.profiles 
WHERE role = 'admin';

-- Step 4: If you don't know your email, make the first user admin
-- Uncomment the following lines if needed:
-- UPDATE public.profiles 
-- SET 
--     role = 'admin',
--     updated_at = NOW()
-- WHERE id = (
--     SELECT id 
--     FROM public.profiles 
--     ORDER BY created_at ASC 
--     LIMIT 1
-- );

-- Step 5: Final verification
SELECT 
    COUNT(*) as admin_count,
    'Total admin users' as description
FROM public.profiles 
WHERE role = 'admin'; 