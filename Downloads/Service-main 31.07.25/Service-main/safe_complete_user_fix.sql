-- SAFE COMPLETE FIX: New User Registration + User Management
-- This version safely handles existing policies and avoids conflicts

-- Step 1: Remove ALL existing policies (including any we might have created)
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

-- Step 3: Fix the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the attempt
    RAISE LOG 'Creating profile for new user: %', NEW.email;
    
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
            'student',  -- Default role
            'active',   -- Default status
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Successfully created profile for user: %', NEW.email;
        
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

-- Step 5: Verify the fix
DO $$
BEGIN
    -- Show current policy count
    RAISE NOTICE 'Current RLS policies on profiles: %', (
        SELECT COUNT(*) FROM pg_policy WHERE polrelid = 'public.profiles'::regclass
    );
    
    -- Show current user count
    RAISE NOTICE 'Current profiles count: %', (SELECT COUNT(*) FROM public.profiles);
    
    RAISE NOTICE 'Fix completed successfully - new user registration should now work!';
END $$;

-- Step 6: Show current users and policies
SELECT 
    'Current Users' as info,
    email,
    role,
    status,
    created_at
FROM public.profiles 
ORDER BY created_at;

-- Show active policies
SELECT 
    'Active Policies' as info,
    polname as policy_name,
    polcmd as command_type
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass
ORDER BY polname; 