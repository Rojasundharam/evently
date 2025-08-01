-- User Management System Migration (Fixed)
-- Handles existing data properly before applying constraints

-- Step 1: Add role and status columns if they don't exist
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT;
    END IF;
    
    -- Add last_sign_in_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_sign_in_at TIMESTAMPTZ;
    END IF;
END $$;

-- Step 2: Clean up existing data and set proper defaults
UPDATE public.profiles 
SET 
    role = CASE 
        WHEN role IS NULL OR role = '' THEN 'student'
        WHEN role NOT IN ('admin', 'staff', 'student') THEN 'student'
        ELSE role
    END,
    status = CASE 
        WHEN status IS NULL OR status = '' THEN 'active'
        WHEN status NOT IN ('active', 'inactive') THEN 'active'
        ELSE status
    END,
    updated_at = NOW()
WHERE role IS NULL 
   OR role = '' 
   OR role NOT IN ('admin', 'staff', 'student')
   OR status IS NULL 
   OR status = '' 
   OR status NOT IN ('active', 'inactive');

-- Step 3: Set NOT NULL constraints after cleaning data
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;

-- Step 4: Set default values for new rows
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'student';
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'active';

-- Step 5: Drop existing constraints if they exist (to avoid conflicts)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'profiles_role_check' 
               AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'profiles_status_check' 
               AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_status_check;
    END IF;
END $$;

-- Step 6: Add constraints for role and status (after data is clean)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'staff', 'student'));

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'inactive'));

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Step 8: Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;

-- Create new RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin users can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 9: Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 11: Create function to update last_sign_in_at
CREATE OR REPLACE FUNCTION public.update_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE public.profiles 
        SET last_sign_in_at = NEW.last_sign_in_at,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create trigger for last sign in updates
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.update_last_sign_in();

-- Step 13: Ensure there's at least one admin user
DO $$
BEGIN
    -- If no admin users exist, make the first user an admin
    IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') = 0 THEN
        UPDATE public.profiles 
        SET role = 'admin', status = 'active', updated_at = NOW()
        WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);
    END IF;
END $$;

-- Step 14: Verify data integrity
DO $$
DECLARE
    invalid_roles_count INTEGER;
    invalid_status_count INTEGER;
BEGIN
    -- Check for any remaining invalid roles
    SELECT COUNT(*) INTO invalid_roles_count
    FROM public.profiles 
    WHERE role NOT IN ('admin', 'staff', 'student') OR role IS NULL;
    
    -- Check for any remaining invalid statuses
    SELECT COUNT(*) INTO invalid_status_count
    FROM public.profiles 
    WHERE status NOT IN ('active', 'inactive') OR status IS NULL;
    
    IF invalid_roles_count > 0 THEN
        RAISE NOTICE 'Warning: % rows have invalid roles', invalid_roles_count;
    END IF;
    
    IF invalid_status_count > 0 THEN
        RAISE NOTICE 'Warning: % rows have invalid status', invalid_status_count;
    END IF;
    
    RAISE NOTICE 'Migration completed successfully. Total profiles: %', (SELECT COUNT(*) FROM public.profiles);
END $$; 