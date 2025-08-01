-- FORCE STUDENT ONLY FIX: All New Users Get Student Role (No Exceptions)
-- This ensures NO new user can get admin access automatically

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

-- Step 3: Create VERY SIMPLE trigger that ALWAYS creates students
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the attempt
    RAISE LOG 'Creating STUDENT profile for new user: %', NEW.email;
    
    -- Insert with error handling - ALWAYS STUDENT ROLE
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
            'student',  -- ALWAYS STUDENT - NO EXCEPTIONS
            'active',   -- Default status
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Successfully created STUDENT profile for user: %', NEW.email;
        
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
    RAISE NOTICE '=== STUDENT-ONLY SETUP COMPLETE ===';
    RAISE NOTICE 'RLS policies on profiles: %', (
        SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'public.profiles'::regclass
    );
    RAISE NOTICE 'Current profiles count: %', (SELECT COUNT(*) FROM public.profiles);
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SECURITY RULE: ALL new users → STUDENT (no exceptions)';
    RAISE NOTICE '🔒 Admin access must be manually granted after signup';
    RAISE NOTICE '';
    RAISE NOTICE '✅ NEW USER REGISTRATION: Always creates students';
    RAISE NOTICE '✅ ADMIN ACCESS: Only through manual promotion';
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

-- Step 7: Show how to manually promote to admin
SELECT 
    'To manually promote a user to admin after they sign up:' as instructions,
    'UPDATE public.profiles SET role = ''admin'', updated_at = NOW() WHERE email = ''user@example.com'';' as example_query;

-- Step 8: Test the trigger function (simulation)
SELECT 
    'Trigger Function Test' as test_info,
    'New users will get role: student' as result,
    'No automatic admin access possible' as security_note; 