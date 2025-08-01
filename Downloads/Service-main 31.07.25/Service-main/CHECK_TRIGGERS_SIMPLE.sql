-- SIMPLE CHECK FOR WHAT'S RESETTING YOUR ROLES
-- This focuses on the most likely causes

-- 1. Check for triggers that reset roles
SELECT 
    'TRIGGERS ON AUTH.USERS' as section,
    trigger_name,
    'This might be resetting your role!' as warning
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name ILIKE '%user%';

-- 2. Look at the handle_new_user function (most likely culprit)
SELECT 
    'HANDLE_NEW_USER FUNCTION' as section,
    CASE 
        WHEN routine_definition ILIKE '%role%student%' THEN 'FOUND: Function sets role to student!'
        WHEN routine_definition ILIKE '%admin%' THEN 'Function mentions admin - check code'
        ELSE 'Function exists but may not affect roles'
    END as analysis
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. Check what happens when you login
SELECT 
    'YOUR CURRENT ROLE' as section,
    email,
    role,
    updated_at,
    CASE 
        WHEN role = 'admin' THEN 'You are admin - but may get reset'
        WHEN role = 'student' THEN 'Role was reset to student!'
        ELSE 'Unknown role: ' || role
    END as status
FROM public.profiles 
WHERE email = 'sroja@jkkn.ac.in';

-- 4. Show the exact function code that's causing the issue
SELECT 
    'FUNCTION CODE ANALYSIS' as section,
    routine_definition as function_code
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public'; 