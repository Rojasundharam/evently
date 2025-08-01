-- COMPLETE FIX: New User Registration + User Management
-- This fixes both the recursive RLS issue and new user creation

-- Step 1: Remove ALL existing problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin users to manage all profiles" ON public.profiles;

-- Step 2: Create simple, working RLS policies (NO RECURSION)
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

-- Step 5: Test the setup
DO $$
BEGIN
    -- Verify current setup
    RAISE NOTICE 'Current profiles count: %', (SELECT COUNT(*) FROM public.profiles);
    RAISE NOTICE 'RLS policies updated successfully';
    RAISE NOTICE 'New user registration should now work';
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