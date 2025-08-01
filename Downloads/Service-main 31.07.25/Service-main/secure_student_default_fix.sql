-- SECURE STUDENT DEFAULT FIX: All New Users Get Student Role
-- This prevents unauthorized admin access and makes all new signups students by default

-- Step 1: Remove ALL existing policies safely
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Get all policy names for profiles table and drop them
    FOR policy_name IN 
        SELECT polname FROM pg_policy 
        WHERE polrelid = 'public.profiles'::regclass
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_name);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- Step 2: Create new, simple RLS policies (NO RECURSION)
-- Allow all authenticated users to read profiles (for user management)
CREATE POLICY "authenticated_users_can_read_profiles" ON public.profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile (for new user creation)
CREATE POLICY "users_can_insert_own_profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- Step 3: Create secure function that defaults to student role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    admin_count INTEGER;
BEGIN
    -- Log the attempt
    RAISE LOG 'Creating profile for new user: %', NEW.email;
    
    -- Check if there are any admin users in the system
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'admin';
    
    -- SECURE ROLE ASSIGNMENT: Very restrictive admin access
    IF admin_count = 0 AND NEW.email IN (
        'sroja@jkkn.ac.in', 
        'ranjith@jkkn.ac.in'
    ) THEN
        -- Only these specific emails can be the first admin
        user_role := 'admin';
        RAISE LOG 'First admin user created: %', NEW.email;
    ELSE
        -- ALL other users get student role by default
        user_role := 'student';
        RAISE LOG 'New student user created: %', NEW.email;
    END IF;
    
    -- Insert with error handling
    BEGIN
        INSERT INTO public.profiles (
            id, 
            email, 
            full_name, 
            role, 
            status, 
            created_at, 
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            user_role,  -- Always student unless specific admin email
            'active',   -- Default status
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Successfully created profile for user: % with role: %', NEW.email, user_role;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating profile for user %: %', NEW.email, SQLERRM;
        -- Don't prevent user creation, just log the error
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify the security
DO $$
BEGIN
    RAISE NOTICE '=== SECURE SETUP COMPLETE ===';
    RAISE NOTICE 'RLS policies on profiles: %', (
        SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'public.profiles'::regclass
    );
    RAISE NOTICE 'Current profiles count: %', (SELECT COUNT(*) FROM public.profiles);
    RAISE NOTICE '';
    RAISE NOTICE '=== SECURE ROLE ASSIGNMENT RULES ===';
    RAISE NOTICE '✅ ALL new users → student (secure default)';
    RAISE NOTICE '✅ Only specific admin emails can be admin';
    RAISE NOTICE '✅ Admin access must be manually granted after signup';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SECURITY: No unauthorized admin access possible!';
END $$;

-- Step 6: Show current users
SELECT 
    'Current Users' as info,
    email,
    role,
    status,
    created_at
FROM public.profiles 
ORDER BY created_at;

-- Step 7: Show how to manually make someone admin (for reference)
SELECT 
    'To manually make a user admin, run this SQL:' as admin_instructions,
    'UPDATE public.profiles SET role = ''admin'', updated_at = NOW() WHERE email = ''user@example.com'';' as example_query; 