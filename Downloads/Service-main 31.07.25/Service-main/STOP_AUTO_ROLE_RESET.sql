-- STOP AUTOMATIC ROLE RESET
-- This script will prevent triggers from automatically changing your role back to 'student'

-- Step 1: Drop the trigger that's likely resetting roles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;

-- Step 2: Modify the handle_new_user function to NOT reset existing admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    existing_role TEXT;
BEGIN
    -- Log the attempt
    RAISE LOG 'Profile update/creation for user: %', NEW.email;
    
    -- Check if profile already exists
    SELECT role INTO existing_role 
    FROM public.profiles 
    WHERE id = NEW.id;
    
    IF existing_role IS NOT NULL THEN
        -- Profile exists - DO NOT change role if it's admin
        IF existing_role = 'admin' THEN
            RAISE LOG 'Preserving admin role for user: %', NEW.email;
            -- Update last sign in but preserve role
            UPDATE public.profiles 
            SET last_sign_in_at = NEW.last_sign_in_at,
                updated_at = NOW()
            WHERE id = NEW.id;
        ELSE
            -- Update non-admin users normally
            UPDATE public.profiles 
            SET last_sign_in_at = NEW.last_sign_in_at,
                updated_at = NOW()
            WHERE id = NEW.id;
        END IF;
    ELSE
        -- New profile - create with default student role
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
            'student',  -- Default for new users
            'active',
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Created new student profile for user: %', NEW.email;
    END IF;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate triggers but with the updated function
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Make yourself admin again (in case it got reset)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'sroja@jkkn.ac.in';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify admin role is preserved
SELECT 
    'ADMIN ROLE PRESERVED' as status,
    email,
    role,
    updated_at,
    'Role should no longer auto-reset' as message
FROM public.profiles 
WHERE email = 'sroja@jkkn.ac.in';

-- Step 6: Test by simulating a login (this would normally reset the role)
DO $$
BEGIN
    -- This would normally trigger the function that resets roles
    UPDATE auth.users 
    SET last_sign_in_at = NOW() 
    WHERE email = 'sroja@jkkn.ac.in';
    
    RAISE NOTICE 'Simulated login - checking if admin role is preserved...';
END $$;

-- Step 7: Final verification
SELECT 
    'FINAL CHECK' as status,
    email,
    role,
    CASE 
        WHEN role = 'admin' THEN 'SUCCESS: Admin role preserved!'
        ELSE 'FAILED: Role was reset again'
    END as result
FROM public.profiles 
WHERE email = 'sroja@jkkn.ac.in'; 