-- MAKE CURRENT USER ADMIN
-- Run this to give yourself admin privileges to edit user roles

-- Method 1: Direct update (if you have basic update permissions)
DO $$
BEGIN
    -- Try to make yourself admin
    UPDATE public.profiles 
    SET role = 'admin', updated_at = NOW()
    WHERE id = auth.uid();
    
    IF FOUND THEN
        RAISE NOTICE 'SUCCESS: You are now an admin!';
        RAISE NOTICE 'Your user ID: %', auth.uid();
        RAISE NOTICE 'You can now edit user roles in the Table Editor';
    ELSE
        RAISE NOTICE 'No profile found for current user';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Direct update failed: %', SQLERRM;
    RAISE NOTICE 'Trying alternative method...';
END $$;

-- Method 2: Temporarily disable RLS if Method 1 fails
-- UNCOMMENT THESE LINES IF THE ABOVE DOESN'T WORK:

-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'sroja@jkkn.ac.in';
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Method 3: Create a temporary admin policy
CREATE OR REPLACE FUNCTION temp_make_admin()
RETURNS void AS $$
BEGIN
    -- Temporarily allow updates
    EXECUTE 'CREATE POLICY "temp_admin_access" ON public.profiles FOR UPDATE USING (true)';
    
    -- Update your role
    UPDATE public.profiles 
    SET role = 'admin', updated_at = NOW()
    WHERE email = 'sroja@jkkn.ac.in';
    
    -- Remove temporary policy
    DROP POLICY IF EXISTS "temp_admin_access" ON public.profiles;
    
    RAISE NOTICE 'Successfully made sroja@jkkn.ac.in an admin';
    
EXCEPTION WHEN OTHERS THEN
    -- Clean up even if there's an error
    DROP POLICY IF EXISTS "temp_admin_access" ON public.profiles;
    RAISE NOTICE 'Error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT temp_make_admin();

-- Clean up the function
DROP FUNCTION IF EXISTS temp_make_admin();

-- Verify the change
SELECT 
    'VERIFICATION' as status,
    email,
    role,
    'Can now edit roles in Table Editor!' as message
FROM public.profiles 
WHERE email = 'sroja@jkkn.ac.in'; 